const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Reset links are single-use and short-lived; only the hash is ever stored, so
// a database leak cannot be replayed against /auth/reset-password/:token.
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10}$/, 'Phone must be 10 digits'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ['patient', 'doctor', 'admin'],
      default: 'patient',
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    termsAccepted: {
      type: Boolean,
      default: false,
    },
    aiDisclaimerAccepted: {
      type: Boolean,
      default: false,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Record when the password changed, so tokens issued earlier can be rejected.
userSchema.pre('save', function (next) {
  if (this.isModified('password') && !this.isNew) {
    // Backdate a second: the JWT is often signed in the same tick as the save,
    // which would otherwise make the fresh token look older than the change.
    this.passwordChangedAt = new Date(Date.now() - 1000);
  }
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Issues a reset token: the raw value goes to the user (email/response), only
 * its SHA-256 hash is persisted. Caller must save() afterwards.
 * @returns {string} the raw token to put in the reset URL
 */
userSchema.methods.createPasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.resetPasswordExpire = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  return rawToken;
};

userSchema.statics.hashResetToken = function (rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/** True when the password changed after the given JWT was issued. */
userSchema.methods.passwordChangedAfter = function (jwtIssuedAtSeconds) {
  if (!this.passwordChangedAt || !jwtIssuedAtSeconds) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIssuedAtSeconds;
};

const User = mongoose.model('User', userSchema);
User.RESET_TOKEN_TTL_MS = RESET_TOKEN_TTL_MS;

// Login looks users up by email (already unique); the admin console lists and
// filters by role, and the doctor-verification queue filters on role + active.
userSchema.index({ role: 1, isActive: 1 });

module.exports = User;
