const { body, param } = require('express-validator');
const Doctor = require('../models/Doctor');

const SPECIALIZATIONS = Doctor.schema.path('specialization').enumValues;

// Mirrors the client-side rule in Signup.js so the two never disagree:
// min 8 chars with one lower, one upper, one digit, one special character.
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&).';

const passwordRule = (field) =>
  body(field).isString().withMessage(PASSWORD_MESSAGE).matches(STRONG_PASSWORD).withMessage(PASSWORD_MESSAGE);

const registerValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 80 }).withMessage('Full name must be 2-80 characters.'),

  body('email').trim().notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),

  body('phone').trim().matches(/^[0-9]{10}$/).withMessage('Phone must be exactly 10 digits.'),

  passwordRule('password'),

  body('role').optional({ values: 'falsy' })
    .isIn(['patient', 'doctor', 'admin']).withMessage('Role must be patient, doctor, or admin.'),

  body('termsAccepted').custom((value) => value === true || value === 'true')
    .withMessage('You must accept the terms and conditions.'),

  // ── Patient-only ──
  body('dob').if(body('role').not().isIn(['doctor', 'admin']))
    .notEmpty().withMessage('Date of birth is required.')
    .isISO8601().withMessage('Date of birth must be a valid date.')
    .custom((value) => new Date(value) < new Date()).withMessage('Date of birth cannot be in the future.'),

  body('gender').if(body('role').not().isIn(['doctor', 'admin']))
    .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other.'),

  // ── Doctor-only ──
  body('medicalLicense').if(body('role').equals('doctor'))
    .trim().notEmpty().withMessage('Medical license number is required.')
    .isLength({ min: 4, max: 40 }).withMessage('Medical license must be 4-40 characters.'),

  body('specialization').if(body('role').equals('doctor'))
    .isIn(SPECIALIZATIONS).withMessage(`Specialization must be one of: ${SPECIALIZATIONS.join(', ')}.`),

  // ── Admin-only ──
  body('hospitalId').if(body('role').equals('admin'))
    .trim().notEmpty().withMessage('Hospital ID is required.')
    .isLength({ min: 2, max: 40 }).withMessage('Hospital ID must be 2-40 characters.'),
];

const loginValidator = [
  body('email').trim().notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password').notEmpty().withMessage('Password is required.'),
  body('role').optional({ values: 'falsy' })
    .isIn(['patient', 'doctor', 'admin']).withMessage('Role must be patient, doctor, or admin.'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Your current password is required.'),
  passwordRule('newPassword'),
  body('newPassword').custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('The new password must be different from the current one.'),
];

const forgotPasswordValidator = [
  body('email').trim().notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false }),
];

const resetPasswordValidator = [
  param('token').isLength({ min: 20 }).withMessage('Invalid or malformed reset token.'),
  passwordRule('password'),
];

module.exports = {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  STRONG_PASSWORD,
  PASSWORD_MESSAGE,
};
