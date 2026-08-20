const express = require('express');
const router = express.Router();
const {
  upload,
  uploadReport,
  getMyReports,
  getReportById,
  getReportFile,
  reviewReport,
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// POST /api/reports/upload (patient uploads)
router.post('/upload', authorize('patient'), upload.single('file'), uploadReport);

// GET /api/reports (patient gets their reports)
router.get('/', authorize('patient'), getMyReports);

// GET /api/reports/:id/file (auth-gated download — replaces static /uploads)
router.get('/:id/file', getReportFile);

// GET /api/reports/:id
router.get('/:id', getReportById);

// PUT /api/reports/:id/review (doctor reviews)
router.put('/:id/review', authorize('doctor'), reviewReport);

module.exports = router;
