const express = require('express');
const router = express.Router();
const {
  upload,
  uploadReport,
  getMyReports,
  getReportById,
  getReportFile,
  reviewReport,
  deleteReport,
  reanalyzeReport,
  getReportTrends,
  getPendingReviews,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validate');
const {
  uploadReportValidator,
  reviewReportValidator,
  reportIdValidator,
} = require('../validators/reportValidators');

// All routes require authentication
router.use(protect);

// POST /api/reports/upload (patient uploads)
// The validators run after multer so req.body holds the multipart text fields.
router.post(
  '/upload',
  authorize('patient'),
  upload.single('file'),
  uploadReportValidator,
  validate,
  uploadReport
);

// GET /api/reports (patient gets their reports)
router.get('/', authorize('patient'), getMyReports);

// GET /api/reports/pending-review (doctor gets reports to review)
router.get('/pending-review', authorize('doctor'), getPendingReviews);

// GET /api/reports/:id/file (auth-gated download — replaces static /uploads)
router.get('/:id/file', reportIdValidator, validate, getReportFile);

// GET /api/reports/:id/trends
router.get('/:id/trends', reportIdValidator, validate, getReportTrends);

// GET /api/reports/:id
router.get('/:id', reportIdValidator, validate, getReportById);

// DELETE /api/reports/:id
router.delete('/:id', reportIdValidator, validate, deleteReport);

// POST /api/reports/:id/reanalyze
router.post('/:id/reanalyze', reportIdValidator, validate, reanalyzeReport);

// PUT /api/reports/:id/review (doctor reviews)
router.put('/:id/review', authorize('doctor'), reviewReportValidator, validate, reviewReport);

module.exports = router;
