import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mockly-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (userId) =>
  jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

/**
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return sendError(res, 'Please provide name, email, and password', 400);
  }

  if (password.length < 6) {
    return sendError(res, 'Password must be at least 6 characters', 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return sendError(res, 'An account with this email already exists', 409);
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id);

  return sendSuccess(res, { token, user: sanitizeUser(user) }, 201);
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 'Please provide email and password', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return sendError(res, 'Invalid email or password', 401);
  }

  const token = generateToken(user._id);

  return sendSuccess(res, { token, user: sanitizeUser(user) });
});

/**
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, { user: sanitizeUser(req.user) });
});
