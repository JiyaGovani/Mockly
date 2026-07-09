import { Router } from 'express';
import protect from '../middleware/auth.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import Question from '../models/Question.js';
import InterviewSession from '../models/InterviewSession.js';

const router = Router();

/**
 * GET /api/dashboard/stats
 * Aggregate dashboard statistics and chart timeseries data.
 */
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { range } = req.query;

    let dateLimit = new Date(0); // Default to all-time
    const now = new Date();
    if (range === '7days') {
      dateLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30days') {
      dateLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 1. Fetch practice attempts within time range
    const attempts = await PracticeAttempt.find({
      user: userId,
      createdAt: { $gte: dateLimit }
    });

    // Calculate core metrics
    const totalQuestionsPracticed = new Set(attempts.map(a => a.question.toString())).size;
    const avgScore = attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.overallScore, 0) / attempts.length)
      : 0;

    // 2. Aggregate average score per topic for the Radar Chart
    const rawMastery = await PracticeAttempt.aggregate([
      { $match: { user: userId, createdAt: { $gte: dateLimit } } },
      {
        $lookup: {
          from: 'questions',
          localField: 'question',
          foreignField: '_id',
          as: 'qDetails'
        }
      },
      { $unwind: '$qDetails' },
      {
        $group: {
          _id: '$qDetails.type',
          avgScore: { $avg: '$overallScore' }
        }
      }
    ]);

    const radarChartData = ['technical', 'behavioral', 'hr', 'aptitude'].map(type => {
      const match = rawMastery.find(m => m._id === type);
      return {
        subject: type.charAt(0).toUpperCase() + type.slice(1),
        A: match ? Math.round(match.avgScore) : 0,
        fullMark: 100
      };
    });

    // 3. Aggregate chronological sequential scores per topic for the Line Chart
    const chronologicalAttempts = await PracticeAttempt.aggregate([
      { $match: { user: userId, createdAt: { $gte: dateLimit } } },
      {
        $lookup: {
          from: 'questions',
          localField: 'question',
          foreignField: '_id',
          as: 'qDetails'
        }
      },
      { $unwind: '$qDetails' },
      { $sort: { createdAt: 1 } }
    ]);

    const typeIndexes = { technical: 0, behavioral: 0, hr: 0, aptitude: 0 };
    const lineChartData = [];

    for (const attempt of chronologicalAttempts) {
      const type = attempt.qDetails.type;
      typeIndexes[type]++;
      const attemptNumber = typeIndexes[type];

      let dataPoint = lineChartData.find(d => d.attemptIndex === attemptNumber);
      if (!dataPoint) {
        dataPoint = {
          attemptIndex: attemptNumber,
          technical: null,
          behavioral: null,
          hr: null,
          aptitude: null
        };
        lineChartData.push(dataPoint);
      }
      dataPoint[type] = attempt.overallScore;
    }

    lineChartData.sort((a, b) => a.attemptIndex - b.attemptIndex);

    // Count active mock interview sessions
    const activeSessions = await InterviewSession.countDocuments({
      user: userId,
      status: 'active',
    });

    res.status(200).json({
      totalQuestionsPracticed,
      avgScore,
      activeSessions,
      radarChartData,
      lineChartData,
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
});

/**
 * GET /api/dashboard/recommendations
 * Identify weak topics and suggest 3 unattempted questions matching the user's role.
 */
router.get('/recommendations', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const allTypes = ['technical', 'behavioral', 'hr', 'aptitude'];

    // 1. Gather all attempts for user to analyze topic history
    const attempts = await PracticeAttempt.find({ user: userId }).populate('question');

    // Determine target job role from query param, attempts history, or fallback to SDE
    let userRole = req.query.role;
    if (!userRole) {
      if (attempts.length > 0) {
        const validAttempt = attempts.find(a => a.question && a.question.role);
        if (validAttempt) {
          userRole = validAttempt.question.role;
        }
      }
    }
    if (!userRole) {
      userRole = 'SDE';
    }

    const topicStats = allTypes.map(type => {
      const typeAttempts = attempts.filter(a => a.question && a.question.type === type);
      const count = typeAttempts.length;
      const avgScore = count > 0
        ? typeAttempts.reduce((sum, a) => sum + a.overallScore, 0) / count
        : 0;

      return { type, count, avgScore };
    });

    // 2. Rank topics: unattempted first, then lowest average score
    topicStats.sort((a, b) => {
      if (a.count === 0 && b.count > 0) return -1;
      if (b.count === 0 && a.count > 0) return 1;
      return a.avgScore - b.avgScore;
    });

    // 3. Suggest 1 unattempted question per top 3 weakest topics
    const weakestTopics = topicStats.slice(0, 3).map(t => t.type);
    const recommendedQuestions = [];

    for (const topic of weakestTopics) {
      // Find active questions matching user role and topic type
      const questions = await Question.find({
        role: userRole,
        type: topic,
        isActive: true
      });

      const attemptedQuestionIds = attempts
        .filter(a => a.question && a.question.type === topic)
        .map(a => a.question._id.toString());

      // Try to find an unattempted question
      let suggested = questions.find(q => !attemptedQuestionIds.includes(q._id.toString()));

      // Fallback: suggest lowest scored attempted question
      if (!suggested && questions.length > 0) {
        const typeAttempts = attempts.filter(a => a.question && a.question.type === topic);
        typeAttempts.sort((a, b) => a.overallScore - b.overallScore);
        if (typeAttempts.length > 0) {
          suggested = questions.find(q => q._id.toString() === typeAttempts[0].question._id.toString());
        }
      }

      if (suggested) {
        recommendedQuestions.push(suggested);
      }
    }

    res.status(200).json(recommendedQuestions.slice(0, 3));
  } catch (err) {
    console.error('Error generating recommendations:', err);
    res.status(500).json({ message: 'Server error generating recommendations' });
  }
});

export default router;
