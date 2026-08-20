const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Protect routes — Requires valid JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. No token provided.',
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    // A password change invalidates every token issued before it, so a stolen
    // token stops working the moment the owner resets their password.
    if (user.passwordChangedAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password was changed recently. Please log in again.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid token.',
    });
  }
};

module.exports = { protect };
