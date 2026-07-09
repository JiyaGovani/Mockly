import { Router } from 'express';
import protect from '../middleware/auth.js';
import { evaluateAttempt } from '../services/evaluationCoordinator.js';
import PracticeAttempt from '../models/PracticeAttempt.js';

const router = Router();

/**
 * POST /api/evaluation/submit
 * Evaluate student answer submission, blend scores, and log the attempt.
 */
router.post('/submit', protect, async (req, res) => {
  try {
    const { questionId, userAnswer } = req.body;
    const userId = req.user._id;

    if (!questionId || !userAnswer) {
      return res.status(400).json({ message: 'Please provide questionId and userAnswer' });
    }

    // 1. Run evaluation coordinator pipeline
    const evaluation = await evaluateAttempt({ questionId, userAnswer });

    // 2. Log attempt in database
    const attempt = await PracticeAttempt.create({
      user: userId,
      question: questionId,
      userAnswer,
      keywordScore: evaluation.keywordScore,
      embeddingScore: evaluation.embeddingScore,
      llmScore: evaluation.llmScore,
      overallScore: evaluation.overallScore,
      matchedKeywords: evaluation.matchedKeywords,
      missingKeywords: evaluation.missingKeywords,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      missingPoints: evaluation.missingPoints,
      suggestions: evaluation.suggestions,
      latency: evaluation.latency,
    });

    // 3. Return standardized evaluation payload
    res.status(201).json({
      attemptId: attempt._id,
      ...evaluation,
    });
  } catch (err) {
    console.error('Submission evaluation error:', err);

    // Map specific AI-related status codes for robust error reporting
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Server error during answer evaluation';

    res.status(statusCode).json({ message });
  }
});

export default router;
