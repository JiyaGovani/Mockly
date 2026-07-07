import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mockly-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate a signed JWT for the given user id.
 */
const generateToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

/**
 * Strip sensitive fields and return a safe user object.
 */
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

/**
 * POST /api/auth/register
 * Create a new user account.
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password must be at least 6 characters' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: 'An account with this email already exists' });
    }

    // Create user (password is hashed in pre-save hook)
    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * POST /api/auth/login
 * Authenticate a user and return a JWT.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Please provide email and password' });
    }

    // Find user and explicitly include password for comparison
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * GET /api/auth/me
 * Return the currently authenticated user (requires protect middleware).
 */
export const getMe = async (req, res) => {
  try {
    res.json({ user: sanitizeUser(req.user) });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
};
