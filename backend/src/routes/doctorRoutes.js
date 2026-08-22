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
/**
 * @openapi
 * /doctors/dashboard:
 *   get:
 *     tags: [Doctors]
 *     summary: Doctor dashboard counters
 *     description: Doctor role only.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/dashboard', protect, authorize('doctor'), getDoctorDashboard);

// GET/PUT /api/doctors/schedule
/**
 * @openapi
 * /doctors/schedule:
 *   get:
 *     tags: [Doctors]
 *     summary: The doctor's weekly schedule
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/schedule', protect, authorize('doctor'), getDoctorSchedule);
router.put('/schedule', protect, authorize('doctor'), saveDoctorSchedule);

// GET /api/doctors/appointments/upcoming
/**
 * @openapi
 * /doctors/appointments/upcoming:
 *   get:
 *     tags: [Doctors]
 *     summary: Next appointments with patient name, time and reason
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/appointments/upcoming', protect, authorize('doctor'), getUpcomingAppointments);

// GET /api/doctors/patients
/**
 * @openapi
 * /doctors/patients:
 *   get:
 *     tags: [Doctors]
 *     summary: Patients derived from this doctor's appointments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         schema: { type: string }
 *         description: Patient name
 *       - in: query
 *         name: status
 *         required: false
 *         schema: { type: string }
 *         description: Active | Follow Up | Discharged
 *       - in: query
 *         name: page
 *         required: false
 *         schema: { type: integer }
 *         description: Page number (default 1)
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/patients', protect, authorize('doctor'), getDoctorPatients);

// GET /api/doctors/patients/:patientId
/**
 * @openapi
 * /doctors/patients/{patientId}:
 *   get:
 *     tags: [Doctors]
 *     summary: One patient profile plus appointment history and reports
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string }
 *         description: Patient user id
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
router.get('/patients/:patientId', protect, authorize('doctor'), getDoctorPatientById);

// PUT /api/doctors/patients/:patientId/status
/**
 * @openapi
 * /doctors/patients/{patientId}/status:
 *   put:
 *     tags: [Doctors]
 *     summary: Set a patient relationship status
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema: { type: string }
 *         description: Patient user id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 description: Active | Follow Up | Discharged
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
router.put('/patients/:patientId/status', protect, authorize('doctor'), updateDoctorPatientStatus);

// Protected routes — declared before /:id so "profile" is never parsed as an id
// PUT /api/doctors/profile
/**
 * @openapi
 * /doctors/profile:
 *   put:
 *     tags: [Doctors]
 *     summary: Update the caller's doctor profile
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               specialization:
 *                 type: string
 *                 description: Must match the schema enum
 *               experience:
 *                 type: number
 *                 description: Years
 *               hospital:
 *                 type: string
 *                 description: Hospital name
 *               consultationFee:
 *                 type: number
 *                 description: Feeds Appointment.consultationFee
 *               bio:
 *                 type: string
 *                 description: Free text
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
/**
 * @openapi
 * /doctors:
 *   get:
 *     tags: [Doctors]
 *     summary: Public doctor directory
 *     description: Verified doctors only. Search spans the doctor name and hospital via an aggregation, so count/page/pages are correct on the search branch too.
 *     parameters:
 *       - in: query
 *         name: search
 *         required: false
 *         schema: { type: string }
 *         description: Doctor name or hospital
 *       - in: query
 *         name: specialization
 *         required: false
 *         schema: { type: string }
 *         description: Exact specialization; "All" means no filter
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
 */
router.get('/', getAllDoctors);

// GET /api/doctors/:id
/**
 * @openapi
 * /doctors/{id}:
 *   get:
 *     tags: [Doctors]
 *     summary: Doctor detail by id
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
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.get('/:id', param('id').isMongoId().withMessage('Invalid doctor id.'), validate, getDoctorById);

// GET /api/doctors/:id/slots?date=YYYY-MM-DD
/**
 * @openapi
 * /doctors/{id}/slots:
 *   get:
 *     tags: [Doctors]
 *     summary: Available slots for a date
 *     description: "Returns [] when the day is disabled or blocked. Booked slots come back with available: false."
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string }
 *         description: YYYY-MM-DD
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "404":
 *         $ref: "#/components/responses/NotFound"
 */
router.get(
  '/:id/slots',
  param('id').isMongoId().withMessage('Invalid doctor id.'),
  validate,
  getAvailableSlots
);

module.exports = router;
