const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    medicalLicense: {
      type: String,
      required: [true, 'Medical license number is required'],
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      enum: [
        'General Physician',
        'Cardiologist',
        'Dermatologist',
        'Neurologist',
        'Pediatrician',
        'Orthopedic',
        'ENT',
        'Ophthalmologist',
        'Psychiatrist',
        'Gynecologist',
        'Urologist',
        'Oncologist',
        'Other',
      ],
    },
    experience: {
      type: Number,
      default: 0, // in years
    },
    hospital: {
      type: String,
      default: 'HealthSphere Main',
    },
    consultationFee: {
      type: Number,
      default: 500,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    availableSlots: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        startTime: String, // e.g. "09:00"
        endTime: String,   // e.g. "17:00"
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Doctor', doctorSchema);
