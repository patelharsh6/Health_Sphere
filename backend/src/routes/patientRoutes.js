const express = require('express');
const router = express.Router();
const {
  getPatientProfile,
  getPatientById,
  updatePatientProfile,
  getDashboard,
} = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(protect);

// GET /api/patients/dashboard
router.get('/dashboard', authorize('patient'), getDashboard);

// GET /api/patients/profile
router.get('/profile', authorize('patient'), getPatientProfile);

// PUT /api/patients/profile
router.put('/profile', authorize('patient'), updatePatientProfile);

// GET /api/patients/:id (doctor/admin can view a patient they treat)
router.get('/:id', authorize('doctor', 'admin'), getPatientById);

module.exports = router;
