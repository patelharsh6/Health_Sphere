/**
 * Wraps an async route handler so a rejected promise reaches Express's error
 * middleware instead of hanging the request.
 *
 * Express 4 does not catch rejections from async functions: an unhandled throw
 * inside `async (req, res) => {}` never calls `next(err)`, so the client waits
 * until it times out. Wrapping every handler is what lets the controllers drop
 * their repetitive try/catch blocks and let the global handler decide the
 * status code and response shape.
 *
 *   router.get('/', asyncHandler(getThings))
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
