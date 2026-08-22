const crypto = require('crypto');
const multer = require('multer');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
const { NODE_ENV } = require('../config/env');

/**
 * Tag every request with a short id, exposed on the response so a user can
 * quote it from a support screenshot and we can find the exact log lines.
 */
const requestId = (req, res, next) => {
  req.id = req.get('X-Request-Id') || crypto.randomBytes(6).toString('hex');
  res.setHeader('X-Request-Id', req.id);
  next();
};

/** 404 for any path that matched no route. Must be mounted after all routes. */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * Translate whatever was thrown into the project's response envelope.
 *
 * Everything funnels through here so controllers can throw and move on. The
 * envelope is always `{ success: false, message, errors? }` — the frontend
 * reads `message` everywhere, and `errors` carries field-level detail.
 */
// eslint-disable-next-line no-unused-vars -- Express needs the 4-arg signature
const errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = 'Internal server error.';
  let errors;

  if (err instanceof ApiError) {
    status = err.status;
    message = err.message;
    errors = err.errors;
  } else if (err instanceof multer.MulterError) {
    // The size limit depends on which endpoint configured multer (10MB for
    // reports, 2MB for avatars), so report the one that actually applied.
    status = 400;
    const limitMb = req.originalUrl.includes('/avatar') ? 2 : 10;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File too large. Maximum size is ${limitMb}MB.`
        : `Upload failed: ${err.message}.`;
  } else if (/^Only PDF|^Avatar must be/.test(err.message || '')) {
    // fileFilter rejections arrive as plain Errors carrying a user-facing message.
    status = 400;
    message = err.message;
  } else if (err.name === 'ValidationError' && err.errors) {
    // Mongoose schema validation.
    status = 400;
    errors = Object.fromEntries(
      Object.entries(err.errors).map(([field, e]) => [field, e.message])
    );
    message = Object.values(errors)[0] || 'Validation failed.';
  } else if (err.name === 'CastError') {
    // A malformed ObjectId is the client's mistake, not a server fault.
    status = 400;
    message = `Invalid value for ${err.path}.`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    message = field
      ? `That ${field} is already in use.`
      : 'That value is already in use.';
    if (field) errors = { [field]: message };
  } else if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Your session has expired. Please sign in again.';
  }

  // A 5xx is a bug: log everything. A 4xx is expected traffic: log briefly.
  if (status >= 500) {
    logger.error(err.message, { requestId: req.id, stack: err.stack, path: req.originalUrl, method: req.method });
  } else {
    logger.warn(`${status} ${req.method} ${req.originalUrl} — ${message}`, { requestId: req.id });
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  // Never ship a stack to a client in production.
  if (NODE_ENV !== 'production' && status >= 500) body.stack = err.stack;

  res.status(status).json(body);
};

module.exports = { requestId, notFound, errorHandler };
