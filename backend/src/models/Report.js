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

module.exports = mongoose.model('Report', reportSchema);
