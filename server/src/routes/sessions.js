import { Router } from 'express';
import protect from '../middleware/auth.js';
import InterviewSession from '../models/InterviewSession.js';
import Question from '../models/Question.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import { evaluateAttempt } from '../services/evaluationCoordinator.js';
import { evaluateBatchAnswers } from '../services/llmService.js';
import { matchKeyPoints } from '../services/keywordService.js';
import { getEmbedding, calculateCosineSimilarity } from '../services/embeddingService.js';
import { checkIsMcq, evaluateMcq } from '../services/evaluators/mcqEvaluator.js';
import { runSecurityChecks } from '../services/evaluators/securityGuard.js';
import { blendEvaluationScores } from '../services/evaluators/scoreBlender.js';

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
async function selectQuestions(role, targetCount = 10) {
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
  const targetRole = (role || '').trim().toUpperCase();

  // Tier 1: Try exact role + bucket distribution matching
  for (const bucket of distribution) {
    const questions = await Question.aggregate([
      {
        $match: {
          role: targetRole,
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

  // Tier 2: Fill remaining slots from any active questions matching the target role
  if (selectedIds.length < targetCount) {
    const roleFallback = await Question.aggregate([
      {
        $match: {
          role: targetRole,
          isActive: true,
          _id: { $nin: selectedIds },
        },
      },
      { $sample: { size: targetCount - selectedIds.length } },
    ]);
    selectedIds.push(...roleFallback.map((q) => q._id));
  }

  // Tier 3: Global Fallback — Fill remaining slots from ANY active questions in database
  if (selectedIds.length < targetCount) {
    const globalFallback = await Question.aggregate([
      {
        $match: {
          isActive: true,
          _id: { $nin: selectedIds },
        },
      },
      { $sample: { size: targetCount - selectedIds.length } },
    ]);
    selectedIds.push(...globalFallback.map((q) => q._id));
  }

  return selectedIds;
}

/**
 * POST /api/sessions/start
 * Create a new mock interview session with 10 balanced questions.
 */
router.post('/start', protect, async (req, res) => {
  try {
    const { role, forceFresh } = req.body;
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
      const durationMs = (existingSession.durationMinutes || 45) * 60 * 1000;
      const elapsedMs = Date.now() - new Date(existingSession.startedAt).getTime();
      const isExpired = elapsedMs >= durationMs;

      if (isExpired || forceFresh) {
        // Mark old session as abandoned so user can start a fresh interview
        await InterviewSession.updateOne(
          { _id: existingSession._id },
          { $set: { status: 'abandoned', completedAt: new Date() } }
        );
      } else {
        // Active non-expired session exists — return it with activeSessionExists flag
        const populated = await InterviewSession.findById(existingSession._id).populate('questions');
        return res.status(200).json({
          message: 'Active mock interview session in progress',
          activeSessionExists: true,
          session: populated,
        });
      }
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

    // Auto-abandon if 45-minute timer has expired
    const durationMs = (session.durationMinutes || 45) * 60 * 1000;
    const elapsedMs = Date.now() - new Date(session.startedAt).getTime();
    if (elapsedMs >= durationMs) {
      await InterviewSession.updateOne(
        { _id: session._id },
        { $set: { status: 'abandoned', completedAt: new Date() } }
      );
      return res.status(200).json({ session: null });
    }

    res.status(200).json({ session });
  } catch (err) {
    console.error('Error fetching active session:', err);
    res.status(500).json({ message: 'Server error fetching session' });
  }
});

/**
 * POST /api/sessions/:id/cancel
 * Explicitly cancel/abandon an active session.
 */
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const session = await InterviewSession.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: 'active',
    });

    if (!session) {
      return res.status(404).json({ message: 'Active session not found' });
    }

    await InterviewSession.updateOne(
      { _id: session._id },
      { $set: { status: 'cancelled', completedAt: new Date() } }
    );

    res.status(200).json({ message: 'Session cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling session:', err);
    res.status(500).json({ message: 'Server error cancelling session' });
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

    // Prepare batch items for single AI call
    const batchItems = [];
    const nonMcqAnswerMap = new Map();

    for (const answer of session.answers) {
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
        answer.latency = { embedding: 0, llm: 0, total: 0 };
        continue;
      }

      try {
        const qId = answer.question.toString();
        const question = await Question.findById(qId);

        if (!question) {
          answer.overallScore = 0;
          answer.weaknesses = ['Question not found'];
          answer.latency = { embedding: 0, llm: 0, total: 0 };
          continue;
        }

        // MCQ check
        if (checkIsMcq(question)) {
          const mcqEval = evaluateMcq(question, answer.userAnswer, Date.now());
          answer.keywordScore = mcqEval.keywordScore;
          answer.embeddingScore = mcqEval.embeddingScore;
          answer.llmScore = mcqEval.llmScore;
          answer.overallScore = mcqEval.overallScore;
          answer.strengths = mcqEval.strengths || [];
          answer.weaknesses = mcqEval.weaknesses || [];
          answer.missingPoints = mcqEval.missingPoints || [];
          answer.suggestions = mcqEval.suggestions || [];
          answer.latency = mcqEval.latency || { embedding: 0, llm: 0, total: 0 };
          continue;
        }

        // Security check
        const secFail = runSecurityChecks(question, answer.userAnswer, Date.now());
        if (secFail) {
          answer.keywordScore = secFail.keywordScore;
          answer.embeddingScore = secFail.embeddingScore;
          answer.llmScore = secFail.llmScore;
          answer.overallScore = secFail.overallScore;
          answer.strengths = secFail.strengths || [];
          answer.weaknesses = secFail.weaknesses || [];
          answer.missingPoints = secFail.missingPoints || [];
          answer.suggestions = secFail.suggestions || [];
          answer.latency = secFail.latency || { embedding: 0, llm: 0, total: 0 };
          continue;
        }

        // Local Keyword matching
        const keywordRes = matchKeyPoints(answer.userAnswer, question.keyPoints);
        answer.matchedKeywords = keywordRes.matchedKeywords || [];
        answer.missingKeywords = keywordRes.missingKeywords || [];
        const keywordScore = keywordRes.keywordScore || 0;

        // Embedding Cosine Similarity calculation
        const embedStart = Date.now();
        let semanticSimilarity = 0;
        let embeddingScore = 0;
        try {
          const userVec = await getEmbedding(answer.userAnswer);
          let expectedVec = question.expectedAnswerEmbedding;
          if (!expectedVec || expectedVec.length === 0 || expectedVec.length !== userVec.length) {
            if (question.expectedAnswer) {
              expectedVec = await getEmbedding(question.expectedAnswer);
              if (expectedVec && expectedVec.length > 0) {
                question.expectedAnswerEmbedding = expectedVec;
                await question.save();
              }
            }
          }
          if (userVec && expectedVec && userVec.length === expectedVec.length) {
            semanticSimilarity = calculateCosineSimilarity(userVec, expectedVec);
            embeddingScore = Math.round(semanticSimilarity * 100);
          }
        } catch (embedErr) {
          console.warn(`Embedding similarity failed for qId ${qId}:`, embedErr.message);
        }
        const embedLatency = Date.now() - embedStart;

        answer.keywordScore = keywordScore;
        answer.embeddingScore = embeddingScore;

        nonMcqAnswerMap.set(qId, {
          answerRef: answer,
          question,
          keywordScore,
          embeddingScore,
          semanticSimilarity,
          embedLatency,
        });

        batchItems.push({
          questionId: qId,
          questionText: question.text,
          expectedAnswer: question.expectedAnswer || '',
          userAnswer: answer.userAnswer,
          matchedKeywords: answer.matchedKeywords,
          missingKeywords: answer.missingKeywords,
          semanticSimilarity,
        });
      } catch (prepErr) {
        console.error(`Prep failed for question answer:`, prepErr);
        answer.overallScore = 0;
        answer.weaknesses = ['Preparation failed for this question'];
        answer.latency = { embedding: 0, llm: 0, total: 0 };
      }
    }

    // Single Batch LLM Call if there are non-MCQ questions
    if (batchItems.length > 0) {
      const llmStart = Date.now();
      try {
        const batchResultsMap = await evaluateBatchAnswers({ items: batchItems });
        const llmLatency = Date.now() - llmStart;

        for (const [qId, meta] of nonMcqAnswerMap.entries()) {
          const evalResult = batchResultsMap.get(qId) || {
            score: 0,
            rubric: { technicalAccuracy: 0, completeness: 0, clarity: 0 },
            strengths: [],
            weaknesses: ['Evaluation response missing for this item'],
            missingPoints: [],
            suggestions: ['Try resubmitting session'],
          };

          meta.answerRef.llmScore = evalResult.score;
          meta.answerRef.strengths = evalResult.strengths || [];
          meta.answerRef.weaknesses = evalResult.weaknesses || [];
          meta.answerRef.missingPoints = evalResult.missingPoints || [];
          meta.answerRef.suggestions = evalResult.suggestions || [];

          // Score Blender
          const blended = blendEvaluationScores({
            question: meta.question,
            keywordResult: {
              score: meta.keywordScore,
              matchedKeywords: meta.answerRef.matchedKeywords || [],
              missingKeywords: meta.answerRef.missingKeywords || [],
            },
            embeddingResult: {
              score: meta.embeddingScore,
              similarity: meta.semanticSimilarity || 0,
            },
            llmResult: {
              score: evalResult.score,
              rubric: evalResult.rubric,
              strengths: evalResult.strengths,
              weaknesses: evalResult.weaknesses,
              missingPoints: evalResult.missingPoints,
              suggestions: evalResult.suggestions,
            },
            embeddingLatency: meta.embedLatency,
            llmLatency: llmLatency,
            totalLatency: meta.embedLatency + llmLatency,
          });

          meta.answerRef.overallScore = blended.overallScore;
          meta.answerRef.latency = blended.latency;
        }
      } catch (batchErr) {
        console.error('Single batch evaluation failed:', batchErr);
        // Fallback gracefully for all batch items
        for (const meta of nonMcqAnswerMap.values()) {
          meta.answerRef.llmScore = 0;
          meta.answerRef.overallScore = Math.round((meta.keywordScore + meta.embeddingScore) / 2);
          meta.answerRef.weaknesses = ['Batch AI evaluation failed for this question'];
          meta.answerRef.latency = { embedding: meta.embedLatency, llm: 0, total: meta.embedLatency };
        }
      }
    }

    // Create PracticeAttempt entries for non-empty answers so dashboard charts update
    for (const answer of session.answers) {
      if (answer.userAnswer && answer.userAnswer.trim() !== '') {
        try {
          await PracticeAttempt.create({
            user: session.user,
            question: answer.question,
            userAnswer: answer.userAnswer,
            keywordScore: answer.keywordScore || 0,
            embeddingScore: answer.embeddingScore || 0,
            llmScore: answer.llmScore || 0,
            overallScore: answer.overallScore || 0,
            matchedKeywords: answer.matchedKeywords || [],
            missingKeywords: answer.missingKeywords || [],
            strengths: answer.strengths || [],
            weaknesses: answer.weaknesses || [],
            missingPoints: answer.missingPoints || [],
            suggestions: answer.suggestions || [],
            latency: answer.latency || { embedding: 0, llm: 0, total: 0 },
          });
        } catch (attemptErr) {
          console.error('Failed to create PracticeAttempt for session answer:', attemptErr);
        }
      }
    }

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
