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

// All routes require authentication
router.use(protect);

// POST /api/appointments (patient books)
router.post('/', authorize('patient'), bookAppointment);

// GET /api/appointments (patient or doctor gets their appointments)
router.get('/', getMyAppointments);

// GET /api/appointments/:id
router.get('/:id', getAppointmentById);

// PUT /api/appointments/:id (doctor can update status, add prescription)
router.put('/:id', authorize('doctor', 'admin'), updateAppointment);

// PUT /api/appointments/:id/cancel
router.put('/:id/cancel', cancelAppointment);

module.exports = router;
