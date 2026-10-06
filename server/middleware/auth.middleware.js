const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Staff = require('../models/Staff');

/**
 * Protect routes: verifies the Bearer JWT token in Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'quickqueue_default_jwt_secret');

      // Check role to query proper model
      if (decoded.role === 'staff') {
        req.user = await Staff.findById(decoded.id).select('-password');
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists or session is invalid',
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, invalid or expired token',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

/**
 * Authorize specific roles (e.g. 'user', 'staff')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden: required role [${roles.join(', ')}]`,
      });
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
