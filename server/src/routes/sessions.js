import { Router } from 'express';
import protect from '../middleware/auth.js';
import InterviewSession from '../models/InterviewSession.js';
import Question from '../models/Question.js';
import { evaluateAttempt } from '../services/evaluationCoordinator.js';

const router = Router();

/**
 * Helper: Select 10 balanced questions for a mock interview.
 * Distribution: 3 Easy, 4 Medium, 3 Hard spread across topics.
 *
 * Target topic distribution:
 *   Technical: 4 questions (1 easy, 2 medium, 1 hard)
 *   Behavioral: 2 questions (1 easy, 1 medium)
 *   HR: 2 questions (1 medium, 1 hard)
 *   Aptitude: 2 questions (1 easy, 1 hard)
 */
async function selectQuestions(role) {
  const distribution = [
    { type: 'technical', difficulty: 'easy', count: 1 },
    { type: 'technical', difficulty: 'medium', count: 2 },
    { type: 'technical', difficulty: 'hard', count: 1 },
    { type: 'behavioral', difficulty: 'easy', count: 1 },
    { type: 'behavioral', difficulty: 'medium', count: 1 },
    { type: 'hr', difficulty: 'medium', count: 1 },
    { type: 'hr', difficulty: 'hard', count: 1 },
    { type: 'aptitude', difficulty: 'easy', count: 1 },
    { type: 'aptitude', difficulty: 'hard', count: 1 },
  ];

  const selectedIds = [];

  for (const bucket of distribution) {
    const questions = await Question.aggregate([
      {
        $match: {
          role: role.toUpperCase(),
          type: bucket.type,
          difficulty: bucket.difficulty,
          isActive: true,
          _id: { $nin: selectedIds },
        },
      },
      { $sample: { size: bucket.count } },
    ]);
    selectedIds.push(...questions.map((q) => q._id));
  }

  // Fallback: if we got fewer than 10, fill with random questions for the role
  if (selectedIds.length < 10) {
    const remaining = await Question.aggregate([
      {
        $match: {
          role: role.toUpperCase(),
          isActive: true,
          _id: { $nin: selectedIds },
        },
      },
      { $sample: { size: 10 - selectedIds.length } },
    ]);
    selectedIds.push(...remaining.map((q) => q._id));
  }

  return selectedIds;
}

/**
 * POST /api/sessions/start
 * Create a new mock interview session with 10 balanced questions.
 */
router.post('/start', protect, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user._id;

    if (!role) {
      return res.status(400).json({ message: 'Please provide a target role' });
    }

    // Check for existing active session
    const existingSession = await InterviewSession.findOne({
      user: userId,
      status: 'active',
    });

    if (existingSession) {
      // Return the existing active session so user can resume
      const populated = await InterviewSession.findById(existingSession._id).populate('questions');
      return res.status(200).json({
        message: 'Resuming existing active session',
        session: populated,
      });
    }

    // Select 10 balanced questions
    const questionIds = await selectQuestions(role);

    if (questionIds.length === 0) {
      return res.status(404).json({
        message: `No questions found for role: ${role}. Please seed questions first.`,
      });
    }

    // Initialize answer stubs for each question
    const answers = questionIds.map((qId) => ({
      question: qId,
      userAnswer: '',
    }));

    const session = await InterviewSession.create({
      user: userId,
      role: role.toUpperCase(),
      questions: questionIds,
      answers,
      status: 'active',
      startedAt: new Date(),
    });

    const populated = await InterviewSession.findById(session._id).populate('questions');

    res.status(201).json({
      message: 'Mock interview session started',
      session: populated,
    });
  } catch (err) {
    console.error('Error starting mock session:', err);
    res.status(500).json({ message: 'Server error starting session' });
  }
});

/**
 * GET /api/sessions/active
 * Get the current user's active session (if any) for resume functionality.
 */
router.get('/active', protect, async (req, res) => {
  try {
    const session = await InterviewSession.findOne({
      user: req.user._id,
      status: 'active',
    }).populate('questions');

    if (!session) {
      return res.status(200).json({ session: null });
    }

    res.status(200).json({ session });
  } catch (err) {
    console.error('Error fetching active session:', err);
    res.status(500).json({ message: 'Server error fetching session' });
  }
});

/**
 * GET /api/sessions/:id
 * Get a specific session by ID (for scorecard display).
 */
router.get('/:id', protect, async (req, res) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('questions');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.status(200).json({ session });
  } catch (err) {
    console.error('Error fetching session:', err);
    res.status(500).json({ message: 'Server error fetching session' });
  }
});

/**
 * PUT /api/sessions/:id/save
 * Save intermediate answers for state recovery.
 */
router.put('/:id/save', protect, async (req, res) => {
  try {
    const { answers } = req.body;
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'active',
    });

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    // Update each answer's userAnswer field
    for (const incoming of answers) {
      const existing = session.answers.find(
        (a) => a.question.toString() === incoming.questionId
      );
      if (existing) {
        existing.userAnswer = incoming.userAnswer;
      }
    }

    await session.save();
    res.status(200).json({ message: 'Answers saved successfully' });
  } catch (err) {
    console.error('Error saving answers:', err);
    res.status(500).json({ message: 'Server error saving answers' });
  }
});

/**
 * POST /api/sessions/:id/submit
 * Submit the session, run AI evaluation on all answers, and generate scorecard.
 */
router.post('/:id/submit', protect, async (req, res) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'active',
    });

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    // Mark session as completed
    session.status = 'completed';
    session.completedAt = new Date();

    // Run AI evaluations concurrently for all non-empty answers
    const evaluationPromises = session.answers.map(async (answer) => {
      if (!answer.userAnswer || answer.userAnswer.trim() === '') {
        // Skip empty answers — score them as 0
        answer.keywordScore = 0;
        answer.embeddingScore = 0;
        answer.llmScore = 0;
        answer.overallScore = 0;
        answer.strengths = [];
        answer.weaknesses = ['No answer was provided'];
        answer.missingPoints = [];
        answer.suggestions = ['Provide an answer to receive feedback'];
        return;
      }

      try {
        const evaluation = await evaluateAttempt({
          questionId: answer.question.toString(),
          userAnswer: answer.userAnswer,
        });

        answer.keywordScore = evaluation.keywordScore;
        answer.embeddingScore = evaluation.embeddingScore;
        answer.llmScore = evaluation.llmScore;
        answer.overallScore = evaluation.overallScore;
        answer.matchedKeywords = evaluation.matchedKeywords || [];
        answer.missingKeywords = evaluation.missingKeywords || [];
        answer.strengths = evaluation.strengths || [];
        answer.weaknesses = evaluation.weaknesses || [];
        answer.missingPoints = evaluation.missingPoints || [];
        answer.suggestions = evaluation.suggestions || [];
      } catch (evalErr) {
        console.error(`Evaluation failed for question ${answer.question}:`, evalErr);
        // Graceful degradation — mark as failed but don't crash the session
        answer.keywordScore = 0;
        answer.embeddingScore = 0;
        answer.llmScore = 0;
        answer.overallScore = 0;
        answer.weaknesses = ['AI evaluation failed for this question'];
        answer.suggestions = ['Try re-submitting or contact support'];
      }
    });

    await Promise.all(evaluationPromises);

    // Calculate overall session score
    const scoredAnswers = session.answers.filter((a) => a.overallScore !== null);
    session.overallScore =
      scoredAnswers.length > 0
        ? Math.round(
            scoredAnswers.reduce((sum, a) => sum + a.overallScore, 0) / scoredAnswers.length
          )
        : 0;

    await session.save();

    // Return the completed session with populated questions
    const completed = await InterviewSession.findById(session._id).populate('questions');

    res.status(200).json({
      message: 'Session submitted and evaluated',
      session: completed,
    });
  } catch (err) {
    console.error('Error submitting session:', err);
    res.status(500).json({ message: 'Server error submitting session' });
  }
});

export default router;
