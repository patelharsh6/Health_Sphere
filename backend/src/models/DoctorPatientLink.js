const mongoose = require('mongoose');

const doctorPatientLinkSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Follow Up', 'Discharged'],
      default: 'Active',
    },
    primaryCondition: {
      type: String,
      default: '',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a patient is linked to a doctor only once
doctorPatientLinkSchema.index({ doctor: 1, patient: 1 }, { unique: true });

module.exports = mongoose.model('DoctorPatientLink', doctorPatientLinkSchema);
