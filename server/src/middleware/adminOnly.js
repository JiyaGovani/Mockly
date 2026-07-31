import User from '../models/User.js';

/**
 * Admin-only middleware.
 * Must be used AFTER `protect` middleware (which attaches req.user).
 * Returns 403 if the authenticated user is not an admin.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Admin access required' });
};

export default adminOnly;
