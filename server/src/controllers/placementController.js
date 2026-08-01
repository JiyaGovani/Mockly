import Question from '../models/Question.js';
import InterviewSession from '../models/InterviewSession.js';
import ThreeRoundAttempt from '../models/ThreeRoundAttempt.js';
import { evaluateAttempt } from '../services/evaluationCoordinator.js';

const MAX_ATTEMPTS = 3;
const APTITUDE_PASS_SCORE = 70;
const TECHNICAL_PASS_SCORE = 75;
const HR_PASS_SCORE = 70;

/* ─── Helpers ──────────────────────────────────────────────────────────── */

/**
 * Get or create a ThreeRoundAttempt for the current user + role.
 * Returns the existing in-progress attempt, or creates a fresh one.
 */
async function getOrCreateAttempt(userId, role) {
  let attempt = await ThreeRoundAttempt.findOne({
    user: userId,
    role: role.toUpperCase(),
  });

  if (!attempt) {
    attempt = await ThreeRoundAttempt.create({
      user: userId,
      role: role.toUpperCase(),
    });
  }

  return attempt;
}

/**
 * Select questions for aptitude round: 10 MCQ questions for the given role.
 */
async function selectAptitudeQuestions(role) {
  const questions = await Question.aggregate([
    {
      $match: {
        role: role.toUpperCase(),
        type: 'aptitude',
        isActive: true,
      },
    },
    { $sample: { size: 10 } },
  ]);
  return questions;
}

/**
 * Select questions for technical round: 3 easy, 4 medium, 3 hard (technical type).
 */
async function selectTechnicalQuestions(role, existingIds = []) {
  const distribution = [
    { difficulty: 'easy', count: 3 },
    { difficulty: 'medium', count: 4 },
    { difficulty: 'hard', count: 3 },
  ];

  const selectedIds = [];

  for (const bucket of distribution) {
    const qs = await Question.aggregate([
      {
        $match: {
          role: role.toUpperCase(),
          type: 'technical',
          difficulty: bucket.difficulty,
          isActive: true,
          _id: { $nin: [...existingIds, ...selectedIds] },
        },
      },
      { $sample: { size: bucket.count } },
    ]);
    selectedIds.push(...qs.map((q) => q._id));
  }

  // Fallback: fill remaining slots if not enough difficulty-specific questions
  if (selectedIds.length < 10) {
    const remaining = await Question.aggregate([
      {
        $match: {
          role: role.toUpperCase(),
          type: 'technical',
          isActive: true,
          _id: { $nin: [...existingIds, ...selectedIds] },
        },
      },
      { $sample: { size: 10 - selectedIds.length } },
    ]);
    selectedIds.push(...remaining.map((q) => q._id));
  }

  return selectedIds;
}

/**
 * Select questions for HR round: behavioral + hr type questions.
 */
async function selectHrQuestions(role) {
  const questions = await Question.aggregate([
    {
      $match: {
        role: role.toUpperCase(),
        type: { $in: ['hr', 'behavioral'] },
        isActive: true,
      },
    },
    { $sample: { size: 10 } },
  ]);
  return questions.map((q) => q._id);
}

/* ─── Controllers ──────────────────────────────────────────────────────── */

/**
 * GET /api/placement/status
 * Returns the current user's active placement attempt for a given role,
 * or null if no attempt exists.
 */
export async function getStatus(req, res) {
  try {
    const { role } = req.query;
    if (!role) {
      return res.status(400).json({ message: 'Role query parameter is required' });
    }

    const attempt = await ThreeRoundAttempt.findOne({
      user: req.user._id,
      role: role.toUpperCase(),
    });

    return res.status(200).json({ attempt: attempt || null });
  } catch (err) {
    console.error('Error fetching placement status:', err);
    return res.status(500).json({ message: 'Server error fetching placement status' });
  }
}

/**
 * POST /api/placement/aptitude/start
 * Start (or resume) the aptitude MCQ round.
 */
export async function startAptitude(req, res) {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'Role is required' });

    const attempt = await getOrCreateAttempt(req.user._id, role);

    // Check if round is locked
    if (attempt.rounds.aptitude.locked) {
      return res.status(403).json({
        message: 'Aptitude round is locked. Maximum attempts reached.',
        locked: true,
      });
    }

    // Check if aptitude already passed
    if (attempt.rounds.aptitude.passed) {
      return res.status(200).json({
        message: 'Aptitude already passed. Proceed to Technical round.',
        alreadyPassed: true,
        attempt,
      });
    }

    // Select 10 MCQ questions
    const questions = await selectAptitudeQuestions(role);
    if (questions.length === 0) {
      return res.status(404).json({
        message: `No aptitude questions found for role: ${role}. Please seed the question bank.`,
      });
    }

    // Store question IDs and reset answer stubs
    attempt.rounds.aptitude.questions = questions.map((q) => q._id);
    attempt.rounds.aptitude.answers = questions.map((q) => ({
      questionId: q._id,
      selectedOption: null,
      isCorrect: false,
    }));

    await attempt.save();

    return res.status(200).json({
      message: 'Aptitude round started',
      questions,
      attempt,
    });
  } catch (err) {
    console.error('Error starting aptitude round:', err);
    return res.status(500).json({ message: 'Server error starting aptitude round' });
  }
}

/**
 * POST /api/placement/aptitude/submit
 * Submit aptitude MCQ answers, calculate score, apply gating logic.
 */
export async function submitAptitude(req, res) {
  try {
    const { role, answers } = req.body;
    // answers: [{ questionId, selectedOption }]
    if (!role || !answers) {
      return res.status(400).json({ message: 'Role and answers are required' });
    }

    const attempt = await ThreeRoundAttempt.findOne({
      user: req.user._id,
      role: role.toUpperCase(),
    }).populate('rounds.aptitude.questions');

    if (!attempt) {
      return res.status(404).json({ message: 'No active placement attempt found' });
    }

    if (attempt.rounds.aptitude.locked) {
      return res.status(403).json({ message: 'Aptitude round is locked.' });
    }

    // Grade each MCQ answer
    const questions = attempt.rounds.aptitude.questions;
    let correctCount = 0;
    const gradedAnswers = answers.map((ans) => {
      const question = questions.find((q) => q._id.toString() === ans.questionId);
      const isCorrect = question && question.correctOption === ans.selectedOption;
      if (isCorrect) correctCount++;
      return {
        questionId: ans.questionId,
        selectedOption: ans.selectedOption,
        isCorrect: !!isCorrect,
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= APTITUDE_PASS_SCORE;

    // Update round data
    attempt.rounds.aptitude.attemptsCount += 1;
    attempt.rounds.aptitude.score = score;
    attempt.rounds.aptitude.passed = passed;
    attempt.rounds.aptitude.answers = gradedAnswers;
    attempt.rounds.aptitude.completedAt = new Date();

    // Lock if max attempts reached and still not passed
    if (!passed && attempt.rounds.aptitude.attemptsCount >= MAX_ATTEMPTS) {
      attempt.rounds.aptitude.locked = true;
      attempt.status = 'failed';
    }

    await attempt.save();

    return res.status(200).json({
      message: passed ? 'Aptitude round passed!' : 'Aptitude round failed.',
      score,
      passed,
      correctCount,
      totalQuestions: questions.length,
      attemptsUsed: attempt.rounds.aptitude.attemptsCount,
      attemptsRemaining: MAX_ATTEMPTS - attempt.rounds.aptitude.attemptsCount,
      locked: attempt.rounds.aptitude.locked,
      attempt,
    });
  } catch (err) {
    console.error('Error submitting aptitude round:', err);
    return res.status(500).json({ message: 'Server error submitting aptitude round' });
  }
}

/**
 * POST /api/placement/technical/start
 * Start the technical subjective round (requires aptitude passed).
 */
export async function startTechnical(req, res) {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'Role is required' });

    const attempt = await ThreeRoundAttempt.findOne({
      user: req.user._id,
      role: role.toUpperCase(),
    });

    if (!attempt) {
      return res.status(404).json({ message: 'No active placement attempt found. Start Aptitude first.' });
    }

    // Gating check
    if (!attempt.rounds.aptitude.passed) {
      return res.status(403).json({
        message: 'You must pass the Aptitude round before accessing Technical.',
        gated: true,
      });
    }

    if (attempt.rounds.technical.locked) {
      return res.status(403).json({ message: 'Technical round is locked.', locked: true });
    }

    if (attempt.rounds.technical.passed) {
      return res.status(200).json({
        message: 'Technical already passed. Proceed to HR round.',
        alreadyPassed: true,
        attempt,
      });
    }

    // Create a new InterviewSession for this technical round
    const questionIds = await selectTechnicalQuestions(role);
    if (questionIds.length === 0) {
      return res.status(404).json({ message: `No technical questions found for role: ${role}.` });
    }

    const answers = questionIds.map((qId) => ({ question: qId, userAnswer: '' }));

    const session = await InterviewSession.create({
      user: req.user._id,
      role: role.toUpperCase(),
      questions: questionIds,
      answers,
      status: 'active',
      startedAt: new Date(),
    });

    attempt.rounds.technical.sessionId = session._id;
    await attempt.save();

    const populated = await InterviewSession.findById(session._id).populate('questions');

    return res.status(201).json({
      message: 'Technical round started',
      session: populated,
      attempt,
    });
  } catch (err) {
    console.error('Error starting technical round:', err);
    return res.status(500).json({ message: 'Server error starting technical round' });
  }
}

/**
 * POST /api/placement/technical/submit
 * Submit technical round — evaluates with hybrid AI scoring.
 */
export async function submitTechnical(req, res) {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'Role is required' });

    const attempt = await ThreeRoundAttempt.findOne({
      user: req.user._id,
      role: role.toUpperCase(),
    });

    if (!attempt || !attempt.rounds.technical.sessionId) {
      return res.status(404).json({ message: 'No active technical session found' });
    }

    const session = await InterviewSession.findOne({
      _id: attempt.rounds.technical.sessionId,
      user: req.user._id,
      status: 'active',
    });

    if (!session) {
      return res.status(404).json({ message: 'Technical session not found or already submitted' });
    }

    // Evaluate all answers using hybrid AI pipeline
    session.status = 'completed';
    session.completedAt = new Date();

    const evaluationPromises = session.answers.map(async (answer) => {
      if (!answer.userAnswer || answer.userAnswer.trim() === '') {
        answer.keywordScore = 0;
        answer.embeddingScore = 0;
        answer.llmScore = 0;
        answer.overallScore = 0;
        answer.weaknesses = ['No answer was provided'];
        answer.suggestions = ['Provide an answer to receive feedback'];
        return;
      }
      try {
        const evaluation = await evaluateAttempt({
          questionId: answer.question.toString(),
          userAnswer: answer.userAnswer,
        });
        Object.assign(answer, {
          keywordScore: evaluation.keywordScore,
          embeddingScore: evaluation.embeddingScore,
          llmScore: evaluation.llmScore,
          overallScore: evaluation.overallScore,
          matchedKeywords: evaluation.matchedKeywords || [],
          missingKeywords: evaluation.missingKeywords || [],
          strengths: evaluation.strengths || [],
          weaknesses: evaluation.weaknesses || [],
          missingPoints: evaluation.missingPoints || [],
          suggestions: evaluation.suggestions || [],
        });
      } catch (evalErr) {
        console.error(`Technical eval failed for Q ${answer.question}:`, evalErr);
        answer.overallScore = 0;
        answer.weaknesses = ['AI evaluation failed'];
      }
    });

    await Promise.all(evaluationPromises);

    const scored = session.answers.filter((a) => a.overallScore !== null);
    session.overallScore =
      scored.length > 0
        ? Math.round(scored.reduce((s, a) => s + a.overallScore, 0) / scored.length)
        : 0;

    await session.save();

    const score = session.overallScore;
    const passed = score >= TECHNICAL_PASS_SCORE;

    attempt.rounds.technical.attemptsCount += 1;
    attempt.rounds.technical.score = score;
    attempt.rounds.technical.passed = passed;
    attempt.rounds.technical.completedAt = new Date();

    if (!passed && attempt.rounds.technical.attemptsCount >= MAX_ATTEMPTS) {
      attempt.rounds.technical.locked = true;
      attempt.status = 'failed';
    }

    await attempt.save();

    const completed = await InterviewSession.findById(session._id).populate('questions');

    return res.status(200).json({
      message: passed ? 'Technical round passed!' : 'Technical round failed.',
      score,
      passed,
      attemptsUsed: attempt.rounds.technical.attemptsCount,
      attemptsRemaining: MAX_ATTEMPTS - attempt.rounds.technical.attemptsCount,
      locked: attempt.rounds.technical.locked,
      session: completed,
      attempt,
    });
  } catch (err) {
    console.error('Error submitting technical round:', err);
    return res.status(500).json({ message: 'Server error submitting technical round' });
  }
}

/**
 * POST /api/placement/hr/start
 * Start the HR/behavioral round (requires technical passed).
 */
export async function startHr(req, res) {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'Role is required' });

    const attempt = await ThreeRoundAttempt.findOne({
      user: req.user._id,
      role: role.toUpperCase(),
    });

    if (!attempt) {
      return res.status(404).json({ message: 'No active placement attempt found.' });
    }

    if (!attempt.rounds.technical.passed) {
      return res.status(403).json({
        message: 'You must pass the Technical round before accessing HR.',
        gated: true,
      });
    }

    if (attempt.rounds.hr.locked) {
      return res.status(403).json({ message: 'HR round is locked.', locked: true });
    }

    if (attempt.rounds.hr.passed) {
      return res.status(200).json({
        message: 'HR round already passed. Placement complete!',
        alreadyPassed: true,
        attempt,
      });
    }

    const questionIds = await selectHrQuestions(role);
    if (questionIds.length === 0) {
      return res.status(404).json({ message: `No HR questions found for role: ${role}.` });
    }

    const answers = questionIds.map((qId) => ({ question: qId, userAnswer: '' }));

    const session = await InterviewSession.create({
      user: req.user._id,
      role: role.toUpperCase(),
      questions: questionIds,
      answers,
      status: 'active',
      startedAt: new Date(),
    });

    attempt.rounds.hr.sessionId = session._id;
    await attempt.save();

    const populated = await InterviewSession.findById(session._id).populate('questions');

    return res.status(201).json({
      message: 'HR round started',
      session: populated,
      attempt,
    });
  } catch (err) {
    console.error('Error starting HR round:', err);
    return res.status(500).json({ message: 'Server error starting HR round' });
  }
}

/**
 * POST /api/placement/hr/submit
 * Submit HR round — LLM-heavy scoring (0.10 keyword + 0.20 embedding + 0.70 LLM).
 */
export async function submitHr(req, res) {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'Role is required' });

    const attempt = await ThreeRoundAttempt.findOne({
      user: req.user._id,
      role: role.toUpperCase(),
    });

    if (!attempt || !attempt.rounds.hr.sessionId) {
      return res.status(404).json({ message: 'No active HR session found' });
    }

    const session = await InterviewSession.findOne({
      _id: attempt.rounds.hr.sessionId,
      user: req.user._id,
      status: 'active',
    });

    if (!session) {
      return res.status(404).json({ message: 'HR session not found or already submitted' });
    }

    session.status = 'completed';
    session.completedAt = new Date();

    // LLM-heavy blended scoring: 0.10 keyword + 0.20 embedding + 0.70 LLM
    const evaluationPromises = session.answers.map(async (answer) => {
      if (!answer.userAnswer || answer.userAnswer.trim() === '') {
        answer.keywordScore = 0;
        answer.embeddingScore = 0;
        answer.llmScore = 0;
        answer.overallScore = 0;
        answer.weaknesses = ['No answer was provided'];
        answer.suggestions = ['Provide an answer to receive feedback'];
        return;
      }
      try {
        const evaluation = await evaluateAttempt({
          questionId: answer.question.toString(),
          userAnswer: answer.userAnswer,
        });
        // Apply LLM-heavy weights for HR
        const hrScore = Math.round(
          0.10 * (evaluation.keywordScore || 0) +
          0.20 * (evaluation.embeddingScore || 0) +
          0.70 * (evaluation.llmScore || 0)
        );
        Object.assign(answer, {
          keywordScore: evaluation.keywordScore,
          embeddingScore: evaluation.embeddingScore,
          llmScore: evaluation.llmScore,
          overallScore: hrScore,
          matchedKeywords: evaluation.matchedKeywords || [],
          missingKeywords: evaluation.missingKeywords || [],
          strengths: evaluation.strengths || [],
          weaknesses: evaluation.weaknesses || [],
          missingPoints: evaluation.missingPoints || [],
          suggestions: evaluation.suggestions || [],
        });
      } catch (evalErr) {
        console.error(`HR eval failed for Q ${answer.question}:`, evalErr);
        answer.overallScore = 0;
        answer.weaknesses = ['AI evaluation failed'];
      }
    });

    await Promise.all(evaluationPromises);

    const scored = session.answers.filter((a) => a.overallScore !== null);
    session.overallScore =
      scored.length > 0
        ? Math.round(scored.reduce((s, a) => s + a.overallScore, 0) / scored.length)
        : 0;

    await session.save();

    const score = session.overallScore;
    const passed = score >= HR_PASS_SCORE;

    attempt.rounds.hr.attemptsCount += 1;
    attempt.rounds.hr.score = score;
    attempt.rounds.hr.passed = passed;
    attempt.rounds.hr.completedAt = new Date();

    if (!passed && attempt.rounds.hr.attemptsCount >= MAX_ATTEMPTS) {
      attempt.rounds.hr.locked = true;
      attempt.status = 'failed';
    }

    if (passed) {
      attempt.status = 'passed';
    }

    await attempt.save();

    const completed = await InterviewSession.findById(session._id).populate('questions');

    return res.status(200).json({
      message: passed ? '🎉 Congratulations! All rounds passed. Placement complete!' : 'HR round failed.',
      score,
      passed,
      placementComplete: passed,
      attemptsUsed: attempt.rounds.hr.attemptsCount,
      attemptsRemaining: MAX_ATTEMPTS - attempt.rounds.hr.attemptsCount,
      locked: attempt.rounds.hr.locked,
      session: completed,
      attempt,
    });
  } catch (err) {
    console.error('Error submitting HR round:', err);
    return res.status(500).json({ message: 'Server error submitting HR round' });
  }
}
