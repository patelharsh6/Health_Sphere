const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validate');
const {
  bookAppointmentValidator,
  updateAppointmentValidator,
  appointmentIdValidator,
} = require('../validators/appointmentValidators');

// All routes require authentication
router.use(protect);

// POST /api/appointments (patient books)
router.post('/', authorize('patient'), bookAppointmentValidator, validate, bookAppointment);

// GET /api/appointments (patient or doctor gets their appointments)
router.get('/', getMyAppointments);

// GET /api/appointments/:id
router.get('/:id', appointmentIdValidator, validate, getAppointmentById);

// PUT /api/appointments/:id (doctor can update status, add prescription)
router.put('/:id', authorize('doctor', 'admin'), updateAppointmentValidator, validate, updateAppointment);

// PUT /api/appointments/:id/cancel
router.put('/:id/cancel', appointmentIdValidator, validate, cancelAppointment);

module.exports = router;
