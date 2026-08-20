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
router.post('/register', credentialsLimiter, registerValidator, validate, register);

// POST /api/auth/login
router.post('/login', credentialsLimiter, loginValidator, validate, login);

// POST /api/auth/forgot-password
router.post('/forgot-password', credentialsLimiter, forgotPasswordValidator, validate, forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', credentialsLimiter, resetPasswordValidator, validate, resetPassword);

// GET /api/auth/me
router.get('/me', protect, getMe);

// PUT /api/auth/password
router.put('/password', protect, changePasswordValidator, validate, changePassword);

// POST /api/auth/avatar
router.post('/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);

// POST /api/auth/logout
router.post('/logout', protect, logout);

module.exports = router;
