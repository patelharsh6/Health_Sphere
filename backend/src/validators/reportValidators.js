const { body, param } = require('express-validator');
const Report = require('../models/Report');

const TYPES = Report.schema.path('type').enumValues;

// Runs after multer, so req.body holds the parsed multipart text fields.
const uploadReportValidator = [
  body('title').trim().notEmpty().withMessage('Report title is required.')
    .isLength({ max: 120 }).withMessage('Title must be 120 characters or fewer.'),
  body('type').optional({ values: 'falsy' })
    .isIn(TYPES).withMessage(`Report type must be one of: ${TYPES.join(', ')}.`),
];

const reviewReportValidator = [
  param('id').isMongoId().withMessage('Invalid report id.'),
  body('comments').trim().notEmpty().withMessage('Review comments are required.')
    .isLength({ max: 2000 }).withMessage('Comments must be 2000 characters or fewer.'),
];

const reportIdValidator = [param('id').isMongoId().withMessage('Invalid report id.')];

module.exports = { uploadReportValidator, reviewReportValidator, reportIdValidator };
