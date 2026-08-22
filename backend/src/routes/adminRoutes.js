const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const {
  getStats,
  getUsers,
  updateUserStatus,
  deleteUser,
  getPendingDoctors,
  verifyDoctor,
  getAppointments,
  getDiseases,
  deleteDisease,
  createDisease,
  getMedicines,
  deleteMedicine,
  createMedicine
} = require('../controllers/adminController');

// All admin routes are protected and restricted to 'admin' role
router.use(protect);
router.use(authorize('admin'));

// Dashboard Stats
/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Platform statistics
 *     description: Users by role, appointments by status, report counts.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/stats', getStats);

// User Management
/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/users', getUsers);
/**
 * @openapi
 * /admin/users/{id}/status:
 *   put:
 *     tags: [Admin]
 *     summary: Activate or deactivate a user
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
 *             required: [isActive]
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: New active state
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
router.put('/users/:id/status', updateUserStatus);
/**
 * @openapi
 * /admin/users/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a user
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
router.delete('/users/:id', deleteUser);

// Doctor Verification
/**
 * @openapi
 * /admin/doctors/pending:
 *   get:
 *     tags: [Admin]
 *     summary: Doctors awaiting verification
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/doctors/pending', getPendingDoctors);
/**
 * @openapi
 * /admin/doctors/{id}/verify:
 *   put:
 *     tags: [Admin]
 *     summary: Approve a doctor
 *     description: Makes the doctor visible in the directory and bookable.
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
router.put('/doctors/:id/verify', verifyDoctor);

// Appointment Oversight
/**
 * @openapi
 * /admin/appointments:
 *   get:
 *     tags: [Admin]
 *     summary: All appointments
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/appointments', getAppointments);

// Content Management (Diseases)
/**
 * @openapi
 * /admin/content/diseases:
 *   get:
 *     tags: [Admin]
 *     summary: List diseases for management
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/content/diseases', getDiseases);
router.post('/content/diseases', createDisease);
/**
 * @openapi
 * /admin/content/diseases/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a disease
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
router.delete('/content/diseases/:id', deleteDisease);

// Content Management (Medicines)
/**
 * @openapi
 * /admin/content/medicines:
 *   get:
 *     tags: [Admin]
 *     summary: List medicines for management
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.get('/content/medicines', getMedicines);
router.post('/content/medicines', createMedicine);
/**
 * @openapi
 * /admin/content/medicines/{id}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete a medicine
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
router.delete('/content/medicines/:id', deleteMedicine);

module.exports = router;
