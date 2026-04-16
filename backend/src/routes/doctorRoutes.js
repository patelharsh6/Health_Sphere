const express = require('express');
const router = express.Router();
const {
  getAllDoctors,
  getDoctorById,
  updateDoctorProfile,
  getAvailableSlots,
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Public routes
// GET /api/doctors
router.get('/', getAllDoctors);

// GET /api/doctors/:id
router.get('/:id', getDoctorById);

// GET /api/doctors/:id/slots?date=YYYY-MM-DD
router.get('/:id/slots', getAvailableSlots);

// Protected routes
// PUT /api/doctors/profile
router.put('/profile', protect, authorize('doctor'), updateDoctorProfile);

module.exports = router;
