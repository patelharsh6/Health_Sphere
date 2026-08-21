const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const {
  getAllDoctors,
  getDoctorById,
  updateDoctorProfile,
  getAvailableSlots,
  getDoctorDashboard,
  getDoctorSchedule,
  saveDoctorSchedule,
  getUpcomingAppointments,
  getDoctorPatients,
  getDoctorPatientById,
  updateDoctorPatientStatus
} = require('../controllers/doctorController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validate');
const { updateDoctorProfileValidator } = require('../validators/profileValidators');

// Protected routes — declared before /:id so literal paths are never parsed as an id

// GET /api/doctors/dashboard
router.get('/dashboard', protect, authorize('doctor'), getDoctorDashboard);

// GET/PUT /api/doctors/schedule
router.get('/schedule', protect, authorize('doctor'), getDoctorSchedule);
router.put('/schedule', protect, authorize('doctor'), saveDoctorSchedule);

// GET /api/doctors/appointments/upcoming
router.get('/appointments/upcoming', protect, authorize('doctor'), getUpcomingAppointments);

// GET /api/doctors/patients
router.get('/patients', protect, authorize('doctor'), getDoctorPatients);

// GET /api/doctors/patients/:patientId
router.get('/patients/:patientId', protect, authorize('doctor'), getDoctorPatientById);

// PUT /api/doctors/patients/:patientId/status
router.put('/patients/:patientId/status', protect, authorize('doctor'), updateDoctorPatientStatus);

// Protected routes — declared before /:id so "profile" is never parsed as an id
// PUT /api/doctors/profile
router.put(
  '/profile',
  protect,
  authorize('doctor'),
  updateDoctorProfileValidator,
  validate,
  updateDoctorProfile
);

// Public routes
// GET /api/doctors
router.get('/', getAllDoctors);

// GET /api/doctors/:id
router.get('/:id', param('id').isMongoId().withMessage('Invalid doctor id.'), validate, getDoctorById);

// GET /api/doctors/:id/slots?date=YYYY-MM-DD
router.get(
  '/:id/slots',
  param('id').isMongoId().withMessage('Invalid doctor id.'),
  validate,
  getAvailableSlots
);

module.exports = router;
