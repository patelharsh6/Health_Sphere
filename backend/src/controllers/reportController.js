const Report = require('../models/Report');
const Patient = require('../models/Patient');
const { parseReport } = require('../utils/reportParser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { STORAGE_DRIVER } = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Multer config for file uploads
const storage = STORAGE_DRIVER === 'cloudinary'
  ? require('../config/cloudinary').storage
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      },
    });

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPEG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/**
 * Reference ranges are sex-specific for several parameters, and trends need the
 * previous report's numbers. Both are looked up here so uploadReport and
 * reanalyzeReport stay in sync.
 */
const buildParseContext = async (patientId, excludeReportId) => {
  const [profile, previous] = await Promise.all([
    Patient.findOne({ user: patientId }).select('gender'),
    Report.findOne({
      patient: patientId,
      ...(excludeReportId ? { _id: { $ne: excludeReportId } } : {}),
      'aiAnalysis.findings.0': { $exists: true },
    })
      .sort({ createdAt: -1 })
      .select('aiAnalysis.findings'),
  ]);

  return {
    sex: profile?.gender,
    previousFindings: previous?.aiAnalysis?.findings || [],
  };
};

/**
 * @desc    Upload a medical report
 * @route   POST /api/reports/upload
 * @access  Private (Patient)
 */
const uploadReport = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a file.' });
  }

  const { title, type } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Report title is required.' });
  }

  // Create report record
  const report = await Report.create({
    patient: req.user._id,
    title,
    type: type || 'other',
    filePath: req.file.path,
    originalFileName: req.file.originalname,
    status: 'processing',
  });

  res.status(201).json({
    success: true,
    message: 'Report uploaded successfully. Analysis is running in the background.',
    data: report,
  });

  // Run AI analysis asynchronously
  const parseContext = await buildParseContext(req.user._id, report._id);

  parseReport(req.file.path, type || 'other', req.file.mimetype, parseContext)
    .then(async (analysis) => {
      report.aiAnalysis = {
        ...analysis,
        analyzedAt: new Date(),
      };
      report.status = 'analyzed';
      await report.save();
    })
    .catch(async (err) => {
      console.error('Background Parse Error:', err);
      report.status = 'failed';
      await report.save();
    });
};

/**
 * @desc    Get all reports for logged-in patient
 * @route   GET /api/reports
 * @access  Private (Patient)
 */
const getMyReports = async (req, res) => {
  const { type, page = 1, limit = 10 } = req.query;
  const filter = { patient: req.user._id };

  if (type) filter.type = type;

  const skip = (page - 1) * limit;
  const total = await Report.countDocuments(filter);

  const reports = await Report.find(filter)
    .sort({ uploadDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    count: total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: reports,
  });
};

/**
 * Decide whether a user may read a report.
 * Owner and admin always may; a doctor only if they treat the patient.
 * @param {Object} report - Report document (patient may be populated)
 * @param {Object} user - req.user
 * @returns {Promise<boolean>}
 */
const canAccessReport = async (report, user) => {
  const patientId = report.patient._id ? report.patient._id.toString() : report.patient.toString();

  if (patientId === user._id.toString()) return true;
  if (user.role === 'admin') return true;

  if (user.role === 'doctor') {
    const Appointment = require('../models/Appointment');
    return Boolean(await Appointment.exists({ doctor: user._id, patient: patientId }));
  }

  return false;
};

/**
 * @desc    Get single report with analysis
 * @route   GET /api/reports/:id
 * @access  Private (owner / treating doctor / admin)
 */
const getReportById = async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('patient', 'fullName email')
    .populate('doctorReview.reviewedBy', 'fullName');

  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found.' });
  }

  if (!(await canAccessReport(report, req.user))) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  res.status(200).json({ success: true, data: report });
};

/**
 * @desc    Stream the stored report file (replaces the old public /uploads mount)
 * @route   GET /api/reports/:id/file
 * @access  Private (owner / treating doctor / admin)
 */
const getReportFile = async (req, res) => {
  const report = await Report.findById(req.params.id);

  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found.' });
  }

  if (!(await canAccessReport(report, req.user))) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  // Keep the resolved path inside the uploads directory
  const absolutePath = path.resolve(report.filePath);
  if (!absolutePath.startsWith(UPLOADS_DIR)) {
    return res.status(400).json({ success: false, message: 'Invalid file path.' });
  }

  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ success: false, message: 'File is no longer available.' });
  }

  res.sendFile(absolutePath);
};

/**
 * @desc    Doctor reviews a report
 * @route   PUT /api/reports/:id/review
 * @access  Private (Doctor)
 */
const reviewReport = async (req, res) => {
  const { comments } = req.body;

  const report = await Report.findById(req.params.id);
  if (!report) {
    return res.status(404).json({ success: false, message: 'Report not found.' });
  }

  report.doctorReview = {
    reviewedBy: req.user._id,
    comments: comments || '',
    reviewedAt: new Date(),
  };

  await report.save();

  res.status(200).json({
    success: true,
    message: 'Report reviewed successfully.',
    data: report,
  });
};

/**
 * @desc    Delete a report
 * @route   DELETE /api/reports/:id
 * @access  Private (Owner)
 */
const deleteReport = async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

  if (report.patient.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  // Remove file if local
  if (!report.filePath.startsWith('http')) {
    const absolutePath = path.resolve(report.filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  }

  await report.deleteOne();

  res.status(200).json({ success: true, message: 'Report deleted successfully.' });
};

/**
 * @desc    Reanalyze a report
 * @route   POST /api/reports/:id/reanalyze
 * @access  Private (Owner)
 */
const reanalyzeReport = async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

  if (report.patient.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  report.status = 'processing';
  await report.save();

  res.status(200).json({ success: true, message: 'Re-analysis started.', data: report });

  const reparseContext = await buildParseContext(report.patient, report._id);

  parseReport(report.filePath, report.type, '', reparseContext)
    .then(async (analysis) => {
      report.aiAnalysis = {
        ...analysis,
        analyzedAt: new Date(),
      };
      report.status = 'analyzed';
      await report.save();
    })
    .catch(async (err) => {
      console.error('Background Parse Error:', err);
      report.status = 'failed';
      await report.save();
    });
};

/**
 * @desc    Get report trends
 * @route   GET /api/reports/:id/trends
 * @access  Private (Owner)
 */
const getReportTrends = async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

  if (report.patient.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  // Find previous reports of same type
  const history = await Report.find({
    patient: req.user._id,
    type: report.type,
    status: 'analyzed'
  }).sort({ uploadDate: 1 }).limit(5);

  res.status(200).json({ success: true, data: history });
};

/**
 * @desc    Get reports pending review
 * @route   GET /api/reports/pending-review
 * @access  Private (Doctor)
 */
const getPendingReviews = async (req, res) => {
  // Basic implementation: find reports without doctor review for doctor's patients
  const Appointment = require('../models/Appointment');
  const appointments = await Appointment.find({ doctor: req.user._id }).select('patient');
  const patientIds = [...new Set(appointments.map(a => a.patient.toString()))];

  const reports = await Report.find({
    patient: { $in: patientIds },
    'doctorReview.reviewedBy': { $exists: false }
  }).populate('patient', 'fullName email');

  res.status(200).json({ success: true, data: reports });
};

module.exports = {
  // multer instance, not a handler — must not be wrapped.
  upload,
  uploadReport: asyncHandler(uploadReport),
  getMyReports: asyncHandler(getMyReports),
  getReportById: asyncHandler(getReportById),
  getReportFile: asyncHandler(getReportFile),
  reviewReport: asyncHandler(reviewReport),
  deleteReport: asyncHandler(deleteReport),
  reanalyzeReport: asyncHandler(reanalyzeReport),
  getReportTrends: asyncHandler(getReportTrends),
  getPendingReviews: asyncHandler(getPendingReviews),
};
