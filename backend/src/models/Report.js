const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['blood_test', 'xray', 'mri', 'ct_scan', 'urine_test', 'ecg', 'ultrasound', 'other'],
      default: 'other',
    },
    filePath: {
      type: String,
      required: [true, 'Report file is required'],
    },
    originalFileName: {
      type: String,
      default: '',
    },
    labName: {
      type: String,
      default: 'Unknown Lab',
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'analyzed', 'failed'],
      default: 'uploaded',
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    // AI Analysis Results
    aiAnalysis: {
      summary: { type: String, default: '' },
      riskLevel: {
        type: String,
        enum: ['low', 'moderate', 'high', 'critical', ''],
        default: '',
      },
      riskScore: {
        type: Number,
        default: 0,
      },
      findings: [
        {
          parameter: String,
          value: String,
          numericValue: Number,
          unit: String,
          trend: {
            type: String,
            enum: ['up', 'down', 'stable', ''],
            default: '',
          },
          normalRange: String,
          status: {
            type: String,
            enum: ['normal', 'low', 'high', 'critical'],
          },
        },
      ],
      recommendations: [{ type: String }],
      // Lets the UI tell "nothing was abnormal" apart from "nothing was
      // readable" — 0 means extraction found no recognisable lab values.
      parametersFound: { type: Number, default: 0 },
      analyzedAt: Date,
    },
    // Doctor's review
    doctorReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      comments: { type: String, default: '' },
      reviewedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ patient: 1, uploadDate: -1 });

// Clients get an API URL to fetch the file through, never the server's own
// absolute path — see GET /api/reports/:id/file.
reportSchema.virtual('fileUrl').get(function () {
  return `/api/reports/${this._id}/file`;
});

// Only the JSON form is stripped — internal code (and getReportFile) still
// reads doc.filePath normally.
reportSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.filePath;
    return ret;
  },
});
reportSchema.set('toObject', { virtuals: true });

// getPendingReviews filters by status; the trends endpoint walks a patient's
// reports newest-first, which the existing { patient, uploadDate } index covers.
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
