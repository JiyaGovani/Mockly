import Question from '../models/Question.js';

/**
 * GET /api/questions
 * Filterable, searchable, paginated question list.
 *
 * Query params:
 *   role       — filter by role name (e.g. "SDE")
 *   type       — filter by question type (technical | behavioral | hr | aptitude)
 *   difficulty — filter by difficulty (easy | medium | hard)
 *   search     — text search on question text
 *   page       — page number (default 1)
 *   limit      — items per page (default 20, max 50)
 */
export const getQuestions = async (req, res) => {
  try {
    const { role, type, difficulty, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    // Build filter
    const filter = { isActive: true };
    if (role) filter.role = role.toUpperCase();
    if (type) filter.type = type.toLowerCase();
    if (difficulty) filter.difficulty = difficulty.toLowerCase();
    if (search) {
      filter.text = { $regex: search, $options: 'i' };
    }

    const [questions, total] = await Promise.all([
      Question.find(filter)
        .select('text role type difficulty options correctOption')
        .sort({ difficulty: 1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Question.countDocuments(filter),
    ]);

    res.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('getQuestions error:', err);
    res.status(500).json({ message: 'Server error fetching questions' });
  }
};

/**
 * GET /api/questions/:id
 * Return a single question by ID (full details for detail view).
 */
export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findOne({
      _id: req.params.id,
      isActive: true,
    }).select('-isActive -__v');

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ question });
  } catch (err) {
    console.error('getQuestionById error:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid question ID' });
    }
    res.status(500).json({ message: 'Server error fetching question' });
  }
};
