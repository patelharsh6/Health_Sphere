const Report = require('../models/Report');
const { parseReport } = require('../utils/reportParser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Multer config for file uploads
const storage = multer.diskStorage({
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
 * @desc    Upload a medical report
 * @route   POST /api/reports/upload
 * @access  Private (Patient)
 */
const uploadReport = async (req, res) => {
  try {
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
    });

    // Run AI analysis (mock)
    const analysis = await parseReport(req.file.path, type || 'other');
    report.aiAnalysis = {
      ...analysis,
      analyzedAt: new Date(),
    };
    await report.save();

    res.status(201).json({
      success: true,
      message: 'Report uploaded and analyzed successfully!',
      data: report,
    });
  } catch (error) {
    console.error('UploadReport Error:', error);
    res.status(500).json({ success: false, message: 'Server error during upload.' });
  }
};

/**
 * @desc    Get all reports for logged-in patient
 * @route   GET /api/reports
 * @access  Private (Patient)
 */
const getMyReports = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('GetMyReports Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
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
  try {
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
  } catch (error) {
    console.error('GetReportById Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Stream the stored report file (replaces the old public /uploads mount)
 * @route   GET /api/reports/:id/file
 * @access  Private (owner / treating doctor / admin)
 */
const getReportFile = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('GetReportFile Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Doctor reviews a report
 * @route   PUT /api/reports/:id/review
 * @access  Private (Doctor)
 */
const reviewReport = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('ReviewReport Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  upload,
  uploadReport,
  getMyReports,
  getReportById,
  getReportFile,
  reviewReport,
};
