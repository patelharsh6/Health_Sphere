const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Disease name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      enum: [
        'Infectious',
        'Chronic',
        'Respiratory',
        'Cardiovascular',
        'Neurological',
        'Digestive',
        'Skin',
        'Autoimmune',
        'Mental Health',
        'Other',
      ],
      default: 'Other',
    },
    symptoms: [{ type: String }],
    causes: [{ type: String }],
    riskFactors: [{ type: String }],
    treatments: [
      {
        name: String,
        description: String,
        type: {
          type: String,
          enum: ['medication', 'therapy', 'surgery', 'lifestyle', 'other'],
        },
      },
    ],
    preventions: [{ type: String }],
    relatedMedicines: [{ type: String }],
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'critical'],
      default: 'moderate',
    },
    specialistType: {
      type: String,
      default: 'General Physician',
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug from name
diseaseSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  }
  next();
});

module.exports = mongoose.model('Disease', diseaseSchema);
