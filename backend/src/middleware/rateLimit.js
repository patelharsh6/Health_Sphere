const { rateLimit } = require('express-rate-limit');
const { NODE_ENV } = require('../config/env');

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Rate limiters return the standard response envelope so the frontend renders
 * the message instead of choking on express-rate-limit's default plain text.
 * 429 is used deliberately — a 401 here would make the axios interceptor wipe
 * the user's token and bounce them to /login.
 */
const envelope = (message) => (req, res) =>
  res.status(429).json({ success: false, message });

const limiter = ({ max, message }) =>
  rateLimit({
    windowMs: WINDOW_MS,
    // Development would otherwise lock out during normal manual testing.
    limit: NODE_ENV === 'production' ? max : max * 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: envelope(message),
  });

/** Applies to every /api/auth route — blunts credential stuffing and enumeration. */
const authLimiter = limiter({
  max: 30,
  message: 'Too many requests. Please try again in 15 minutes.',
});

/** Tighter cap for the endpoints that actually guess or reset credentials. */
const credentialsLimiter = limiter({
  max: 10,
  message: 'Too many attempts. Please try again in 15 minutes.',
});

module.exports = { authLimiter, credentialsLimiter };
