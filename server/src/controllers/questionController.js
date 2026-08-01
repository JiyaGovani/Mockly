import Question from '../models/Question.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHelper.js';

/**
 * GET /api/questions
 * Filterable, searchable, paginated question list.
 */
export const getQuestions = asyncHandler(async (req, res) => {
  const { role, type, difficulty, search } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

  const filter = { isActive: true };
  if (role) filter.role = role.toUpperCase();
  if (type) filter.type = type.toLowerCase();
  if (difficulty) filter.difficulty = difficulty.toLowerCase();
  if (search) filter.text = { $regex: search, $options: 'i' };

  const [questions, total] = await Promise.all([
    Question.find(filter)
      .select('text role type difficulty options correctOption')
      .sort({ difficulty: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Question.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    questions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /api/questions/:id
 * Return a single question by ID.
 */
export const getQuestionById = asyncHandler(async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      isActive: true,
    }).select('-isActive -__v');

    if (!question) {
      return sendError(res, 'Question not found', 404);
    }

    return sendSuccess(res, { question });
  } catch (err) {
    if (err.name === 'CastError') {
      return sendError(res, 'Invalid question ID', 400);
    }
    throw err;
  }
});
