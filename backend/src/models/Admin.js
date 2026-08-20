const mongoose = require('mongoose');

const PERMISSIONS = [
  'manage_users',
  'verify_doctors',
  'manage_content',
  'view_reports',
  'manage_appointments',
];

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    hospitalId: {
      type: String,
      required: [true, 'Hospital ID is required'],
      trim: true,
    },
    permissions: {
      type: [String],
      enum: PERMISSIONS,
      // A self-registered admin can operate the platform but cannot elevate
      // other accounts until a superadmin grants manage_users (Phase 7).
      default: ['verify_doctors', 'manage_content', 'manage_appointments'],
    },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.model('Admin', adminSchema);
Admin.PERMISSIONS = PERMISSIONS;

module.exports = Admin;
