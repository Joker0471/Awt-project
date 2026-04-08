const { verifyAccessToken } = require('../config/jwt');
const User                  = require('../models/User');

/**
 * protect — verifies JWT access token and attaches req.user
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token missing' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is suspended or inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Access token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid access token' });
  }
};

/**
 * restrictTo — role-based access control
 * Usage: restrictTo('admin') or restrictTo('admin', 'premium')
 */
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role: ${roles.join(' or ')}`,
    });
  }
  next();
};

/**
 * optionalAuth — attaches req.user if a valid token is present, but never blocks
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      const user    = await User.findById(decoded.id);
      if (user && user.status === 'active') req.user = user;
    }
  } catch {}
  next();
};

module.exports = { protect, restrictTo, optionalAuth };
