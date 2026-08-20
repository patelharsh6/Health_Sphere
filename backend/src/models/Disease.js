const mongoose = require('mongoose');
const { slugify } = require('../utils/slugify');

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
      // Must cover every chip rendered by frontend/src/pages/DiseaseListing.js
      enum: [
        'Infectious',
        'Chronic',
        'Respiratory',
        'Cardiovascular',
        'Neurological',
        'Endocrine',
        'Musculoskeletal',
        'Hematological',
        'Urological',
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

// Auto-generate slug from name — an explicitly supplied slug always wins,
// so seed data can pin the slugs the frontend links to.
diseaseSchema.pre('save', function (next) {
  if (!this.slug || (this.isModified('name') && !this.isModified('slug'))) {
    this.slug = slugify(this.name);
  }
  next();
});

// insertMany() bypasses 'save' hooks entirely, which previously left every
// seeded disease without a slug (making /diseases/:slug unresolvable).
diseaseSchema.pre('insertMany', function (next, docs) {
  if (Array.isArray(docs)) {
    docs.forEach((doc) => {
      if (!doc.slug && doc.name) doc.slug = slugify(doc.name);
    });
  }
  next();
});

module.exports = mongoose.model('Disease', diseaseSchema);
