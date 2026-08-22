/**
 * An error carrying the HTTP status the client should see.
 *
 * Anything thrown that is NOT an ApiError is treated as a bug by the global
 * handler: it is logged in full and reported to the client as a generic 500,
 * so an internal message (a stack, a Mongo error, a file path) can never leak.
 *
 * Note on 401 vs 403: the frontend's axios interceptor wipes the token and
 * redirects to /login on any 401. Authorization failures ("you are logged in
 * but may not touch this") must therefore be 403 — a 401 would silently log a
 * valid user out. `ApiError.forbidden()` exists to make that the easy choice.
 */
class ApiError extends Error {
  /**
   * @param {number} status  HTTP status code
   * @param {string} message client-safe message
   * @param {object} [errors] field-level errors, shape { field: message }
   */
  constructor(status, message, errors = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    // Marks this as a deliberate, client-safe failure rather than a crash.
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Bad request.', errors) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Not authorized.') {
    return new ApiError(401, message);
  }

  /** Use this, not 401, when the user is authenticated but lacks permission. */
  static forbidden(message = 'You do not have permission to do that.') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found.') {
    return new ApiError(404, message);
  }

  static conflict(message = 'That conflicts with something that already exists.') {
    return new ApiError(409, message);
  }

  static tooMany(message = 'Too many requests. Please try again later.') {
    return new ApiError(429, message);
  }

  static internal(message = 'Internal server error.') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
