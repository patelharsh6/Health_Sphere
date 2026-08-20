const { validationResult } = require('express-validator');

/**
 * Runs after a chain of express-validator rules and converts any failures into
 * the standard response envelope. Placed last in a route's middleware array so
 * the controller only ever sees a validated body.
 *
 * Shape: { success: false, message, errors: { field: 'first message' } }
 * `message` carries the first failure so existing frontend `alert(message)`
 * paths stay useful; `errors` is keyed by field for inline form display.
 */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = {};
  for (const err of result.array()) {
    // Keep the first message per field — later rules on the same field are
    // usually consequences of the first failure.
    if (!(err.path in errors)) errors[err.path] = err.msg;
  }

  return res.status(400).json({
    success: false,
    message: Object.values(errors)[0],
    errors,
  });
};

module.exports = { validate };
