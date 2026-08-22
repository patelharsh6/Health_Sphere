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
const { validate } = require('../middleware/validate');
const { updatePatientProfileValidator } = require('../validators/profileValidators');
const { param } = require('express-validator');

// All routes require authentication
router.use(protect);

// GET /api/patients/dashboard
/**
 * @openapi
 * /patients/dashboard:
 *   get:
 *     tags: [Patients]
 *     summary: Patient dashboard counters
 *     description: Patient role only.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/dashboard', authorize('patient'), getDashboard);

// GET /api/patients/profile
/**
 * @openapi
 * /patients/profile:
 *   get:
 *     tags: [Patients]
 *     summary: The caller's own patient profile
 *     description: Patient role only.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/profile', authorize('patient'), getPatientProfile);

// PUT /api/patients/profile
router.put(
  '/profile',
  authorize('patient'),
  updatePatientProfileValidator,
  validate,
  updatePatientProfile
);

// GET /api/patients/:id (doctor/admin can view a patient they treat)
/**
 * @openapi
 * /patients/{id}:
 *   get:
 *     tags: [Patients]
 *     summary: Read one patient by id
 *     description: A doctor may only read a patient they share an appointment with (403 otherwise). Admins may read anyone.
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
router.get(
  '/:id',
  authorize('doctor', 'admin'),
  param('id').isMongoId().withMessage('Invalid patient id.'),
  validate,
  getPatientById
);

module.exports = router;
