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
/**
 * @openapi
 * /appointments:
 *   post:
 *     tags: [Appointments]
 *     summary: Book an appointment
 *     description: Patient role only. Rejects past dates, disabled or blocked days, times outside the day's slots, unverified doctors, and more than 2 open bookings with the same doctor. A partial unique index on { doctor, date, time } makes concurrent bookings of one slot return 409.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctorId, date, time]
 *             properties:
 *               doctorId:
 *                 type: string
 *                 description: Doctor PROFILE id (not the user id)
 *               date:
 *                 type: string
 *                 description: YYYY-MM-DD
 *               time:
 *                 type: string
 *                 description: HH:MM 24-hour
 *               reason:
 *                 type: string
 *                 description: Up to 500 characters
 *     responses:
 *       "201":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "409":
 *         $ref: "#/components/responses/BadRequest"
 */
router.post('/', authorize('patient'), bookAppointmentValidator, validate, bookAppointment);

// GET /api/appointments (patient or doctor gets their appointments)
/**
 * @openapi
 * /appointments:
 *   get:
 *     tags: [Appointments]
 *     summary: List the caller's appointments
 *     description: "Role-aware: patients see their own, doctors see theirs."
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         required: false
 *         schema: { type: string }
 *         description: pending | confirmed | completed | cancelled
 *       - in: query
 *         name: page
 *         required: false
 *         schema: { type: integer }
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         required: false
 *         schema: { type: integer }
 *         description: Items per page (max 100)
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
router.get('/', getMyAppointments);

// GET /api/appointments/today (patient or doctor gets their today's appointments)
/**
 * @openapi
 * /appointments/today:
 *   get:
 *     tags: [Appointments]
 *     summary: Today's appointments
 *     description: Role-aware; backs both dashboards.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
router.get('/today', getTodayAppointments);

// GET /api/appointments/:id
/**
 * @openapi
 * /appointments/{id}:
 *   get:
 *     tags: [Appointments]
 *     summary: One appointment
 *     description: Only the patient, the treating doctor, or an admin. Others get 403.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.get('/:id', appointmentIdValidator, validate, getAppointmentById);

// GET /api/appointments/:id/receipt
/**
 * @openapi
 * /appointments/{id}/receipt:
 *   get:
 *     tags: [Appointments]
 *     summary: Consultation-fee summary
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.get('/:id/receipt', appointmentIdValidator, validate, getAppointmentReceipt);

// PUT /api/appointments/:id (doctor can update status, add prescription)
/**
 * @openapi
 * /appointments/{id}:
 *   put:
 *     tags: [Appointments]
 *     summary: Update an appointment
 *     description: Treating doctor or admin only.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 description: New status
 *               notes:
 *                 type: string
 *                 description: Doctor notes
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.put('/:id', authorize('doctor', 'admin'), updateAppointmentValidator, validate, updateAppointment);

// PUT /api/appointments/:id/reschedule (patient reschedules)
/**
 * @openapi
 * /appointments/{id}/reschedule:
 *   put:
 *     tags: [Appointments]
 *     summary: Patient-initiated reschedule
 *     description: Re-checks availability and keeps an audit trail on the document.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, time]
 *             properties:
 *               date:
 *                 type: string
 *                 description: YYYY-MM-DD
 *               time:
 *                 type: string
 *                 description: HH:MM
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 *       "409":
 *         $ref: "#/components/responses/BadRequest"
 */
router.put('/:id/reschedule', authorize('patient'), rescheduleAppointmentValidator, validate, rescheduleAppointment);

// PUT /api/appointments/:id/confirm (doctor confirms)
/**
 * @openapi
 * /appointments/{id}/confirm:
 *   put:
 *     tags: [Appointments]
 *     summary: Confirm an appointment
 *     description: Treating doctor or admin.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.put('/:id/confirm', authorize('doctor', 'admin'), appointmentIdValidator, validate, confirmAppointment);

// PUT /api/appointments/:id/complete (doctor completes and adds prescription)
/**
 * @openapi
 * /appointments/{id}/complete:
 *   put:
 *     tags: [Appointments]
 *     summary: Complete an appointment with notes and prescription
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Consultation notes
 *               prescription:
 *                 type: array
 *                 description: Prescribed medicines
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.put('/:id/complete', authorize('doctor', 'admin'), completeAppointmentValidator, validate, completeAppointment);

// PUT /api/appointments/:id/cancel
/**
 * @openapi
 * /appointments/{id}/cancel:
 *   put:
 *     tags: [Appointments]
 *     summary: Cancel an appointment
 *     description: Records cancelledBy and cancellationReason. Frees the slot for rebooking.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellationReason:
 *                 type: string
 *                 description: Why it was cancelled
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.put('/:id/cancel', cancelAppointmentValidator, validate, cancelAppointment);

module.exports = router;
