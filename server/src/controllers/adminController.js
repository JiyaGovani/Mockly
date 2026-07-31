import User from '../models/User.js';
import Question from '../models/Question.js';
import Role from '../models/Role.js';
import PracticeAttempt from '../models/PracticeAttempt.js';

/* ═══════════════════════════════════════════════════════════════
   STATS
═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/admin/stats
 * Platform-wide aggregate stats.
 */
export async function getStats(req, res) {
  try {
    const [
      totalUsers,
      totalStudents,
      totalQuestions,
      activeQuestions,
      totalAttempts,
      scoreAgg,
      questionsByType,
      questionsByDifficulty,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      Question.countDocuments(),
      Question.countDocuments({ isActive: true }),
      PracticeAttempt.countDocuments(),
      PracticeAttempt.aggregate([
        { $group: { _id: null, avgScore: { $avg: '$overallScore' } } },
      ]),
      Question.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Question.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      ]),
      User.find({ role: 'student' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email createdAt'),
    ]);

    const platformAvgScore = scoreAgg[0]?.avgScore
      ? Math.round(scoreAgg[0].avgScore)
      : 0;

    const byType = Object.fromEntries(
      questionsByType.map((t) => [t._id, t.count])
    );
    const byDifficulty = Object.fromEntries(
      questionsByDifficulty.map((d) => [d._id, d.count])
    );

    return res.status(200).json({
      totalUsers,
      totalStudents,
      totalQuestions,
      activeQuestions,
      totalAttempts,
      platformAvgScore,
      questionsByType: byType,
      questionsByDifficulty: byDifficulty,
      recentUsers,
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return res.status(500).json({ message: 'Server error fetching stats' });
  }
}

/* ═══════════════════════════════════════════════════════════════
   USERS
═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/admin/users
 * All users with per-user attempt count and average score.
 */
export async function getUsers(req, res) {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // Aggregate per-user stats from PracticeAttempt
    const userIds = users.map((u) => u._id);
    const statsAgg = await PracticeAttempt.aggregate([
      { $match: { user: { $in: userIds } } },
      {
        $group: {
          _id: '$user',
          totalAttempts: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
        },
      },
    ]);

    const statsMap = Object.fromEntries(
      statsAgg.map((s) => [
        s._id.toString(),
        {
          totalAttempts: s.totalAttempts,
          avgScore: Math.round(s.avgScore),
        },
      ])
    );

    const enriched = users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      ...(statsMap[u._id.toString()] || { totalAttempts: 0, avgScore: null }),
    }));

    return res.status(200).json({ users: enriched });
  } catch (err) {
    console.error('Error fetching admin users:', err);
    return res.status(500).json({ message: 'Server error fetching users' });
  }
}

/* ═══════════════════════════════════════════════════════════════
   QUESTIONS
═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/admin/questions
 * All questions (including inactive), paginated.
 */
export async function getQuestions(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role.toUpperCase();
    if (req.query.type) filter.type = req.query.type;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;
    if (req.query.active !== undefined) filter.isActive = req.query.active === 'true';

    const [questions, total] = await Promise.all([
      Question.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Question.countDocuments(filter),
    ]);

    return res.status(200).json({
      questions,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Error fetching questions:', err);
    return res.status(500).json({ message: 'Server error fetching questions' });
  }
}

/**
 * POST /api/admin/questions
 * Create a single question.
 */
export async function createQuestion(req, res) {
  try {
    const question = await Question.create(req.body);
    return res.status(201).json({ message: 'Question created', question });
  } catch (err) {
    console.error('Error creating question:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Server error creating question' });
  }
}

/**
 * POST /api/admin/questions/bulk
 * Insert an array of questions.
 */
export async function bulkCreateQuestions(req, res) {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'questions must be a non-empty array' });
    }
    const inserted = await Question.insertMany(questions, { ordered: false });
    return res.status(201).json({
      message: `${inserted.length} questions imported`,
      count: inserted.length,
    });
  } catch (err) {
    console.error('Error bulk creating questions:', err);
    return res.status(500).json({ message: 'Server error during bulk import' });
  }
}

/**
 * PUT /api/admin/questions/:id
 * Update a question.
 */
export async function updateQuestion(req, res) {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!question) return res.status(404).json({ message: 'Question not found' });
    return res.status(200).json({ message: 'Question updated', question });
  } catch (err) {
    console.error('Error updating question:', err);
    return res.status(500).json({ message: 'Server error updating question' });
  }
}

/**
 * DELETE /api/admin/questions/:id
 * Soft-delete: sets isActive to false.
 */
export async function deleteQuestion(req, res) {
  try {
    const question = await Question.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!question) return res.status(404).json({ message: 'Question not found' });
    return res.status(200).json({ message: 'Question deactivated', question });
  } catch (err) {
    console.error('Error deleting question:', err);
    return res.status(500).json({ message: 'Server error deleting question' });
  }
}

/* ═══════════════════════════════════════════════════════════════
   ROLES
═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/admin/roles
 */
export async function getRoles(req, res) {
  try {
    const roles = await Role.find().sort({ createdAt: -1 });
    return res.status(200).json({ roles });
  } catch (err) {
    console.error('Error fetching roles:', err);
    return res.status(500).json({ message: 'Server error fetching roles' });
  }
}

/**
 * POST /api/admin/roles
 */
export async function createRole(req, res) {
  try {
    const role = await Role.create(req.body);
    return res.status(201).json({ message: 'Role created', role });
  } catch (err) {
    console.error('Error creating role:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A role with that name already exists' });
    }
    return res.status(500).json({ message: 'Server error creating role' });
  }
}

/**
 * PUT /api/admin/roles/:id
 */
export async function updateRole(req, res) {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!role) return res.status(404).json({ message: 'Role not found' });
    return res.status(200).json({ message: 'Role updated', role });
  } catch (err) {
    console.error('Error updating role:', err);
    return res.status(500).json({ message: 'Server error updating role' });
  }
}

/**
 * DELETE /api/admin/roles/:id
 */
export async function deleteRole(req, res) {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    return res.status(200).json({ message: 'Role deleted' });
  } catch (err) {
    console.error('Error deleting role:', err);
    return res.status(500).json({ message: 'Server error deleting role' });
  }
}
