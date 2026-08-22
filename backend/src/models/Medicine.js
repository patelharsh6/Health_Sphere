const mongoose = require('mongoose');
const { slugify } = require('../utils/slugify');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medicine name is required'],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    genericName: {
      type: String,
      required: [true, 'Generic name is required'],
    },
    summary: {
      type: String,
      required: [true, 'Summary is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    category: {
      type: String,
      enum: [
        'Pain Relief',
        'Antibiotic',
        'Diabetes',
        'Cardiovascular',
        'Gastrointestinal',
        'Allergy',
        'Thyroid',
        'Respiratory',
        'Supplement',
        'Other',
      ],
      required: [true, 'Category is required'],
    },
    type: {
      type: String,
      enum: [
        'Tablet',
        'Capsule',
        'Syrup',
        'Injection',
        'Softgel',
        'Ointment',
        'Drops',
        'Inhaler',
      ],
      required: [true, 'Medicine type is required'],
    },
    prescriptionRequired: {
      type: Boolean,
      default: false,
    },
    uses: [{ type: String }],
    howItWorks: {
      type: String,
    },
    dosage: {
      adult: String,
      child: String,
      maxDaily: String,
      notes: String,
    },
    sideEffects: {
      common: [{ type: String }],
      serious: [{ type: String }],
    },
    precautions: [{ type: String }],
    interactions: [
      {
        with: String,
        effect: String,
        severity: {
          type: String,
          enum: ['low', 'moderate', 'high'],
        },
      },
    ],
    quickInfo: {
      usedFor: String,
      safeForChildren: String,
      pregnancySafe: String,
    },
    relatedDiseases: [{ type: String }], // Array of disease slugs
    alternatives: [{ type: String }], // Array of medicine slugs
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Text indexing for search
medicineSchema.index({ name: 'text', genericName: 'text', description: 'text' });

// Auto-generate slug from name
medicineSchema.pre('save', function (next) {
  if (!this.slug || (this.isModified('name') && !this.isModified('slug'))) {
    this.slug = slugify(this.name);
  }
  next();
});

// For seeder
medicineSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => {
      if (!doc.slug && doc.name) doc.slug = slugify(doc.name);
    });
  }
  next();
});

// Mirrors the disease catalog: listing filters by category and type.
medicineSchema.index({ category: 1, name: 1 });
medicineSchema.index({ isActive: 1, category: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
