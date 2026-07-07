import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mockly-dev-secret-change-in-production';

/**
 * Auth middleware – verifies JWT from Authorization header
 * and attaches the user document to req.user.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ message: 'Not authorized — no token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user (exclude password)
    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ message: 'Not authorized — user no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: 'Not authorized — token invalid or expired' });
  }
};

export default protect;
