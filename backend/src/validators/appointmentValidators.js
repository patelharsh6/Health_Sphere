const { body, param } = require('express-validator');
const Appointment = require('../models/Appointment');

const STATUSES = Appointment.schema.path('status').enumValues;

// "09:00" / "14:30" — the slot format produced by getAvailableSlots.
const TIME_24H = /^([01]\d|2[0-3]):[0-5]\d$/;

const objectId = (name, location = param) =>
  location(name).isMongoId().withMessage('Invalid id.');

const bookAppointmentValidator = [
  body('doctorId').notEmpty().withMessage('Please select a doctor.')
    .isMongoId().withMessage('Invalid doctor id.'),

  body('date').notEmpty().withMessage('Please select a date.')
    .isISO8601().withMessage('Date must be a valid date.'),

  body('time').notEmpty().withMessage('Please select a time slot.')
    .matches(TIME_24H).withMessage('Time must be in HH:MM 24-hour format.'),

  body('reason').optional({ values: 'null' })
    .isString().withMessage('Reason must be text.')
    .isLength({ max: 500 }).withMessage('Reason must be 500 characters or fewer.'),
];

const updateAppointmentValidator = [
  objectId('id'),
  body('status').optional({ values: 'falsy' })
    .isIn(STATUSES).withMessage(`Status must be one of: ${STATUSES.join(', ')}.`),
  body('prescription').optional({ values: 'null' })
    .isString().withMessage('Prescription must be text.')
    .isLength({ max: 2000 }).withMessage('Prescription must be 2000 characters or fewer.'),
  body('notes').optional({ values: 'null' })
    .isString().withMessage('Notes must be text.')
    .isLength({ max: 2000 }).withMessage('Notes must be 2000 characters or fewer.'),
];

const appointmentIdValidator = [objectId('id')];

module.exports = {
  bookAppointmentValidator,
  updateAppointmentValidator,
  appointmentIdValidator,
};
