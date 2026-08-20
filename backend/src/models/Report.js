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
      findings: [
        {
          parameter: String,
          value: String,
          normalRange: String,
          status: {
            type: String,
            enum: ['normal', 'low', 'high', 'critical'],
          },
        },
      ],
      recommendations: [{ type: String }],
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

module.exports = mongoose.model('Report', reportSchema);
