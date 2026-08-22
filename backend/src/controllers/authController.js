const path = require('path');
const fs = require('fs');
const multer = require('multer');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Admin = require('../models/Admin');
const { generateToken } = require('../utils/jwt');
const { NODE_ENV, CLIENT_URL } = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');

const AVATARS_DIR = path.resolve(__dirname, '../../uploads/avatars');
fs.mkdirSync(AVATARS_DIR, { recursive: true });

// ──────────────────────────────────────────────
// AVATAR UPLOAD (multer)
// ──────────────────────────────────────────────

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    // Namespaced by user id so a stale file can never be served to someone else.
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Avatar must be a JPEG, PNG, or WebP image.'), false);
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
});

/** Public URL path stored on User.avatar; served by the static /uploads/avatars mount. */
const avatarUrlFor = (filename) => `/uploads/avatars/${filename}`;

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

/** The user shape every auth response returns — never includes the password. */
const publicUser = (user) => ({
  id: user._id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  avatar: user.avatar,
  createdAt: user.createdAt,
});

/** Loads the role-specific profile document for a user, or null. */
const loadProfile = async (user) => {
  if (user.role === 'patient') return Patient.findOne({ user: user._id });
  if (user.role === 'doctor') return Doctor.findOne({ user: user._id });
  if (user.role === 'admin') return Admin.findOne({ user: user._id });
  return null;
};

/**
 * @desc    Register a new user (Patient / Doctor / Admin)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  const {
    fullName, email, phone, password, role,
    // Patient fields
    dob, gender,
    // Doctor fields
    medicalLicense, specialization,
    // Admin fields
    hospitalId,
    // Checkboxes
    termsAccepted, aiDisclaimerAccepted,
  } = req.body;

  const effectiveRole = role || 'patient';

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'An account with this email already exists.',
    });
  }

  // Check if medical license already exists for a doctor
  if (effectiveRole === 'doctor' && medicalLicense) {
    const existingLicense = await Doctor.findOne({ medicalLicense });
    if (existingLicense) {
      return res.status(400).json({
        success: false,
        message: 'A doctor with this medical license is already registered.',
      });
    }
  }

  // Create base user
  const user = await User.create({
    fullName,
    email,
    phone,
    password,
    role: effectiveRole,
    termsAccepted,
    aiDisclaimerAccepted,
  });

  // Create role-specific profile. If profile creation fails the base user
  // would otherwise be left orphaned — with an email that can never be
  // registered again — so roll it back.
  let profile;
  try {
    if (effectiveRole === 'patient') {
      profile = await Patient.create({
        user: user._id,
        dateOfBirth: dob,
        gender,
      });
    } else if (effectiveRole === 'doctor') {
      profile = await Doctor.create({
        user: user._id,
        medicalLicense,
        specialization,
        // A doctor may not self-verify: their medical license has to be
        // checked by an admin (PUT /api/admin/doctors/:id/verify, Phase 7)
        // before they become bookable. Unverified doctors are already
        // excluded from GET /api/doctors.
        isVerified: false,
        availableSlots: [
          { day: 'Monday', startTime: '09:00', endTime: '16:00' },
          { day: 'Tuesday', startTime: '09:00', endTime: '16:00' },
          { day: 'Wednesday', startTime: '09:00', endTime: '16:00' },
          { day: 'Thursday', startTime: '09:00', endTime: '16:00' },
          { day: 'Friday', startTime: '09:00', endTime: '16:00' },
        ],
      });
    } else if (effectiveRole === 'admin') {
      profile = await Admin.create({
        user: user._id,
        hospitalId,
      });
    }
  } catch (profileError) {
    await User.findByIdAndDelete(user._id);
    throw profileError;
  }

  // Generate token
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message:
      effectiveRole === 'doctor'
        ? 'Account created. Your medical license is pending verification by an administrator.'
        : 'Account created successfully!',
    data: {
      token,
      user: publicUser(user),
      profile,
    },
  });
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password.',
    });
  }

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  // Check if role matches (optional: enforce role-based login)
  if (role && user.role !== role) {
    return res.status(401).json({
      success: false,
      message: `No ${role} account found with this email.`,
    });
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Account has been deactivated. Contact support.',
    });
  }

  // An unverified doctor may still log in — the UI shows a pending state —
  // so `isVerified` travels with the login response too.
  const profile = await loadProfile(user);

  // Generate token
  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful!',
    data: {
      token,
      user: publicUser(user),
      isVerified: user.role === 'doctor' ? !!profile?.isVerified : true,
    },
  });
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const profile = await loadProfile(user);

  res.status(200).json({
    success: true,
    data: {
      user: publicUser(user),
      profile,
      // Non-doctors are trivially "verified" so the UI can gate on one flag.
      isVerified: user.role === 'doctor' ? !!profile?.isVerified : true,
    },
  });
};

/**
 * @desc    Change the logged-in user's password
 * @route   PUT /api/auth/password
 * @access  Private
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    // 403, not 401 — a 401 would make the axios interceptor drop the token
    // and bounce a legitimately logged-in user to /login.
    return res.status(403).json({
      success: false,
      message: 'Your current password is incorrect.',
    });
  }

  user.password = newPassword;
  await user.save();

  // The old token is now invalid (passwordChangedAt), so hand back a fresh one
  // to keep the user signed in on this device.
  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully.',
    data: { token },
  });
};

/**
 * @desc    Request a password reset token
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  // Always answer identically — a different response for a missing account
  // would turn this endpoint into an email-enumeration oracle.
  const genericResponse = {
    success: true,
    message: 'If an account exists for that email, a password reset link has been sent.',
  };

  if (!user || !user.isActive) {
    return res.status(200).json(genericResponse);
  }

  const rawToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${CLIENT_URL}/reset-password/${rawToken}`;

  // Mail delivery lands in Phase 8 (nodemailer). Until then the link is
  // logged server-side, and returned in the response outside production so
  // the flow is testable end to end without an SMTP account.
  console.log(`🔑 Password reset link for ${user.email}: ${resetUrl}`);

  if (NODE_ENV === 'production') {
    return res.status(200).json(genericResponse);
  }

  res.status(200).json({
    ...genericResponse,
    data: {
      // Development only — never sent in production.
      resetToken: rawToken,
      resetUrl,
      expiresInMinutes: Math.round(User.RESET_TOKEN_TTL_MS / 60000),
    },
  });
};

/**
 * @desc    Reset a password using the emailed token
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = async (req, res) => {
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: User.hashResetToken(req.params.token),
    resetPasswordExpire: { $gt: new Date() },
  }).select('+password +resetPasswordToken +resetPasswordExpire');

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'This password reset link is invalid or has expired.',
    });
  }

  user.password = password;
  // Single use: burn the token whether or not the user logs in next.
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Password reset successfully. You are now signed in.',
    data: { token, user: publicUser(user) },
  });
};

/**
 * @desc    Log out
 * @route   POST /api/auth/logout
 * @access  Private
 *
 * JWTs are stateless, so there is nothing to revoke server-side yet — the
 * client discards the token. The endpoint exists so the frontend has one
 * place to call, and so a blacklist or refresh-token rotation can be added
 * here later without another frontend change.
 */
const logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

/**
 * @desc    Upload / replace the logged-in user's avatar
 * @route   POST /api/auth/avatar
 * @access  Private
 */
const uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select an image to upload.' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    fs.promises.unlink(req.file.path).catch(() => {});
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const previousAvatar = user.avatar;
  user.avatar = avatarUrlFor(req.file.filename);
  await user.save({ validateBeforeSave: false });

  // Drop the replaced file so uploads/avatars does not grow without bound.
  if (previousAvatar && previousAvatar.startsWith('/uploads/avatars/')) {
    const oldPath = path.join(AVATARS_DIR, path.basename(previousAvatar));
    if (oldPath.startsWith(AVATARS_DIR)) {
      fs.promises.unlink(oldPath).catch(() => {});
    }
  }

  res.status(200).json({
    success: true,
    message: 'Avatar updated successfully.',
    data: { avatar: user.avatar },
  });
};

module.exports = {
  register: asyncHandler(register),
  login: asyncHandler(login),
  getMe: asyncHandler(getMe),
  changePassword: asyncHandler(changePassword),
  forgotPassword: asyncHandler(forgotPassword),
  resetPassword: asyncHandler(resetPassword),
  logout: asyncHandler(logout),
  // multer instance, not a handler — must not be wrapped.
  avatarUpload,
  uploadAvatar: asyncHandler(uploadAvatar),
  // plain path string, not a handler.
  AVATARS_DIR,
};
