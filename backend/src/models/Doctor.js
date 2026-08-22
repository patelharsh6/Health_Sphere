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
        // Added so Disease.specialistType values always resolve to a real doctor
        'Endocrinologist',
        'Pulmonologist',
        'Nephrologist',
        'Gastroenterologist',
        'Rheumatologist',
        'Hematologist',
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
    weeklySchedule: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        enabled: {
          type: Boolean,
          default: true,
        },
        slots: [String], // Array of times like "09:00", "14:30"
      },
    ],
    slotDuration: {
      type: Number,
      default: 30, // in minutes
    },
    blockedDates: [Date],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// getAllDoctors filters on isVerified + specialization and sorts by rating;
// this covers that access path so the directory does not collection-scan.
doctorSchema.index({ isVerified: 1, specialization: 1, rating: -1 });
doctorSchema.index({ hospital: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
