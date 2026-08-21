const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  getTodayAppointments,
  rescheduleAppointment,
  confirmAppointment,
  completeAppointment,
  getAppointmentReceipt,
} = require('../controllers/appointmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validate');
const {
  bookAppointmentValidator,
  updateAppointmentValidator,
  rescheduleAppointmentValidator,
  completeAppointmentValidator,
  cancelAppointmentValidator,
  appointmentIdValidator,
} = require('../validators/appointmentValidators');

// All routes require authentication
router.use(protect);

// POST /api/appointments (patient books)
router.post('/', authorize('patient'), bookAppointmentValidator, validate, bookAppointment);

// GET /api/appointments (patient or doctor gets their appointments)
router.get('/', getMyAppointments);

// GET /api/appointments/today (patient or doctor gets their today's appointments)
router.get('/today', getTodayAppointments);

// GET /api/appointments/:id
router.get('/:id', appointmentIdValidator, validate, getAppointmentById);

// GET /api/appointments/:id/receipt
router.get('/:id/receipt', appointmentIdValidator, validate, getAppointmentReceipt);

// PUT /api/appointments/:id (doctor can update status, add prescription)
router.put('/:id', authorize('doctor', 'admin'), updateAppointmentValidator, validate, updateAppointment);

// PUT /api/appointments/:id/reschedule (patient reschedules)
router.put('/:id/reschedule', authorize('patient'), rescheduleAppointmentValidator, validate, rescheduleAppointment);

// PUT /api/appointments/:id/confirm (doctor confirms)
router.put('/:id/confirm', authorize('doctor', 'admin'), appointmentIdValidator, validate, confirmAppointment);

// PUT /api/appointments/:id/complete (doctor completes and adds prescription)
router.put('/:id/complete', authorize('doctor', 'admin'), completeAppointmentValidator, validate, completeAppointment);

// PUT /api/appointments/:id/cancel
router.put('/:id/cancel', cancelAppointmentValidator, validate, cancelAppointment);

module.exports = router;
