const { body } = require('express-validator');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

const GENDERS = Patient.schema.path('gender').enumValues;
const BLOOD_GROUPS = Patient.schema.path('bloodGroup').enumValues;
const SPECIALIZATIONS = Doctor.schema.path('specialization').enumValues;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * The profile form sends `null` for a cleared numeric input and the controllers
 * treat `null`/`''` as "leave it alone", so both must pass validation. Anything
 * else has to be a number inside the given range.
 */
const numericField = (name, { min, max, label }) =>
  body(name).optional({ values: 'null' }).custom((value) => {
    if (value === '') return true;
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error(`${label} must be a number.`);
    if (n < min || n > max) throw new Error(`${label} must be between ${min} and ${max}.`);
    return true;
  });

const stringArrayField = (name, label) =>
  body(name).optional({ values: 'null' }).isArray().withMessage(`${label} must be a list.`)
    .bail()
    .custom((arr) => arr.every((item) => typeof item === 'string' && item.length <= 100))
    .withMessage(`Each ${label.toLowerCase()} entry must be text of 100 characters or fewer.`);

// Fields shared by both profile endpoints (they both forward to User).
const userFields = [
  body('fullName').optional({ values: 'falsy' }).trim()
    .isLength({ min: 2, max: 80 }).withMessage('Full name must be 2-80 characters.'),
  body('phone').optional({ values: 'falsy' }).trim()
    .matches(/^[0-9]{10}$/).withMessage('Phone must be exactly 10 digits.'),
];

const updatePatientProfileValidator = [
  ...userFields,

  body('dateOfBirth').optional({ values: 'falsy' })
    .isISO8601().withMessage('Date of birth must be a valid date.')
    .custom((value) => new Date(value) < new Date())
    .withMessage('Date of birth cannot be in the future.'),

  body('gender').optional({ values: 'falsy' })
    .isIn(GENDERS).withMessage(`Gender must be one of: ${GENDERS.join(', ')}.`),

  body('bloodGroup').optional({ values: 'null' })
    .isIn(BLOOD_GROUPS).withMessage('Please select a valid blood group.'),

  numericField('height', { min: 30, max: 300, label: 'Height (cm)' }),
  numericField('weight', { min: 1, max: 500, label: 'Weight (kg)' }),

  stringArrayField('allergies', 'Allergies'),
  stringArrayField('chronicConditions', 'Conditions'),

  body('emergencyContact').optional({ values: 'null' })
    .isObject().withMessage('Emergency contact must be an object.'),
  body('emergencyContact.name').optional({ values: 'null' }).trim()
    .isLength({ max: 80 }).withMessage('Emergency contact name must be 80 characters or fewer.'),
  body('emergencyContact.relation').optional({ values: 'null' }).trim()
    .isLength({ max: 40 }).withMessage('Emergency contact relation must be 40 characters or fewer.'),
  body('emergencyContact.phone').optional({ values: 'falsy' }).trim()
    .matches(/^[0-9]{10}$/).withMessage('Emergency contact phone must be exactly 10 digits.'),
];

const updateDoctorProfileValidator = [
  ...userFields,

  body('specialization').optional({ values: 'falsy' })
    .isIn(SPECIALIZATIONS).withMessage(`Specialization must be one of: ${SPECIALIZATIONS.join(', ')}.`),

  numericField('experience', { min: 0, max: 70, label: 'Experience (years)' }),
  numericField('consultationFee', { min: 0, max: 100000, label: 'Consultation fee' }),

  body('hospital').optional({ values: 'falsy' }).trim()
    .isLength({ max: 120 }).withMessage('Hospital name must be 120 characters or fewer.'),

  body('bio').optional({ values: 'null' }).isString().withMessage('Bio must be text.')
    .isLength({ max: 500 }).withMessage('Bio must be 500 characters or fewer.'),

  body('availableSlots').optional({ values: 'null' })
    .isArray().withMessage('Available slots must be a list.'),
  body('availableSlots.*.day').optional()
    .isIn(DAYS).withMessage('Slot day must be a weekday name.'),
  body('availableSlots.*.startTime').optional()
    .matches(TIME_24H).withMessage('Slot start time must be in HH:MM 24-hour format.'),
  body('availableSlots.*.endTime').optional()
    .matches(TIME_24H).withMessage('Slot end time must be in HH:MM 24-hour format.'),
];

module.exports = { updatePatientProfileValidator, updateDoctorProfileValidator };
