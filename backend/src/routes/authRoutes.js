const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  avatarUpload,
  uploadAvatar,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { authLimiter, credentialsLimiter } = require('../middleware/rateLimit');
const {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidators');

// Every auth route is rate limited; the credential-guessing ones get a
// tighter cap on top.
router.use(authLimiter);

// POST /api/auth/register
/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a patient, doctor or admin
 *     description: Self-registered doctors are created unverified and cannot be booked until an admin approves them. Rate limited to 10 requests / 15 min / IP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, phone, password, termsAccepted]
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full name
 *               email:
 *                 type: string
 *                 description: Unique email
 *               phone:
 *                 type: string
 *                 description: 10-digit phone
 *               password:
 *                 type: string
 *                 description: Min 8 chars with upper, lower, digit and special
 *               role:
 *                 type: string
 *                 description: patient | doctor | admin (default patient)
 *               termsAccepted:
 *                 type: boolean
 *                 description: Must be true
 *               medicalLicense:
 *                 type: string
 *                 description: Doctors only
 *               specialization:
 *                 type: string
 *                 description: Doctors only
 *               hospitalId:
 *                 type: string
 *                 description: Admins only
 *     responses:
 *       "201":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 */
router.post('/register', credentialsLimiter, registerValidator, validate, register);

// POST /api/auth/login
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Sign in and receive a JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 description: Account email
 *               password:
 *                 type: string
 *                 description: Account password
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
router.post('/login', credentialsLimiter, loginValidator, validate, login);

// POST /api/auth/forgot-password
/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password-reset link
 *     description: Answers identically for unknown emails so it cannot enumerate accounts. Outside production the reset URL is returned in the response.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 description: Account email
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 */
router.post('/forgot-password', credentialsLimiter, forgotPasswordValidator, validate, forgotPassword);

// POST /api/auth/reset-password/:token
/**
 * @openapi
 * /auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Consume a reset token and set a new password
 *     description: Single use, valid 30 minutes. Only a SHA-256 hash of the token is stored server-side.
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *         description: Raw token from the emailed link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 description: New password
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 */
router.post('/reset-password/:token', credentialsLimiter, resetPasswordValidator, validate, resetPassword);

// GET /api/auth/me
/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Current user plus role profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
router.get('/me', protect, getMe);

// PUT /api/auth/password
/**
 * @openapi
 * /auth/password:
 *   put:
 *     tags: [Auth]
 *     summary: Change password and rotate the token
 *     description: A wrong current password returns 403, not 401, so the client does not wipe a valid session. Tokens issued before the change stop working.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Existing password
 *               newPassword:
 *                 type: string
 *                 description: Replacement password
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "403":
 *         $ref: "#/components/responses/Forbidden"
 */
router.put('/password', protect, changePasswordValidator, validate, changePassword);

// POST /api/auth/avatar
/**
 * @openapi
 * /auth/avatar:
 *   post:
 *     tags: [Auth]
 *     summary: Upload a profile picture
 *     description: JPEG, PNG or WebP, max 2MB. Replaces and deletes any previous avatar.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 description: Image file (binary)
 *     responses:
 *       "200":
 *         description: Success
 *       "400":
 *         $ref: "#/components/responses/BadRequest"
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
router.post('/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);

// POST /api/auth/logout
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Stateless logout acknowledgement
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       "200":
 *         description: Success
 *       "401":
 *         $ref: "#/components/responses/Unauthorized"
 */
router.post('/logout', protect, logout);

module.exports = router;
