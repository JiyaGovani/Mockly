import Question from '../models/Question.js';
import { matchKeyPoints } from './keywordService.js';
import { getEmbedding, calculateCosineSimilarity } from './embeddingService.js';
import { evaluateAnswer } from './llmService.js';
import { checkIsMcq, evaluateMcq } from './evaluators/mcqEvaluator.js';
import { runSecurityChecks } from './evaluators/securityGuard.js';
import { blendEvaluationScores } from './evaluators/scoreBlender.js';

/**
 * ==============================================================================
 * MAIN AI EVALUATION COORDINATOR
 * ==============================================================================
 * This function controls the entire interview answer evaluation process.
 * It takes a Question ID and User Answer, and runs it through a 6-step pipeline:
 * 1. Fetch Question from MongoDB
 * 2. MCQ Check (If multiple choice, evaluate instantly)
 * 3. Security Guard (Detect empty input, prompt injection, or copy-pasted text)
 * 4. Keyword & Vector Embedding similarity calculations (in parallel)
 * 5. Gemini AI feedback generation (strengths, weaknesses, suggestions)
 * 6. Score Blending (Calculate dynamic final score based on question type)
 */
export async function evaluateAttempt({ questionId, userAnswer }) {
  const totalStart = Date.now(); // Track evaluation latency in milliseconds

  // STEP 1: Fetch question details from MongoDB database using its ID
  const question = await Question.findById(questionId);
  if (!question) {
    throw new Error('Question not found');
  }

  // STEP 2: Check if this is a Multiple Choice Question (MCQ). If yes, grade instantly.
  if (checkIsMcq(question)) {
    return evaluateMcq(question, userAnswer, totalStart);
  }

  // STEP 3: Run Security & Anti-Gaming Guard. Block invalid or malicious inputs.
  const securityFailure = runSecurityChecks(question, userAnswer, totalStart);
  if (securityFailure) {
    return securityFailure;
  }

  // STEP 4: Run Keyword Matching and Vector Embedding Cosine Similarity in parallel
  const embedStart = Date.now();
  
  // 4a. Match user answer against expected key points (Keyword Score)
  const keywordPromise = Promise.resolve(matchKeyPoints(userAnswer, question.keyPoints));

  // 4b. Generate vector embeddings & compute Cosine Similarity score
  const embeddingPromise = (async () => {
    const userVec = await getEmbedding(userAnswer);
    let expectedVec = question.expectedAnswerEmbedding;

    // Cache expected answer embedding in DB if not already present
    if (!expectedVec || expectedVec.length === 0 || expectedVec.length !== userVec.length) {
      if (question.expectedAnswer) {
        expectedVec = await getEmbedding(question.expectedAnswer);
        if (expectedVec && expectedVec.length > 0) {
          question.expectedAnswerEmbedding = expectedVec;
          await question.save(); // Cache in MongoDB
        }
      }
    }

    // Calculate semantic cosine similarity between answer vectors
    const similarity = calculateCosineSimilarity(expectedVec, userVec);
    // Normalize score (threshold at 0.45 relevance)
    const normalizedScore = similarity < 0.45 ? 0 : Math.round(((similarity - 0.45) / 0.55) * 100);

    return {
      similarity,
      score: Math.min(100, Math.max(0, normalizedScore)),
    };
  })();

  // Wait for both keyword matching and embedding calculations to complete
  const [keywordResult, embeddingResult] = await Promise.all([keywordPromise, embeddingPromise]);
  const embeddingLatency = Date.now() - embedStart;

  // STEP 5: Call Google Gemini AI LLM to get qualitative feedback and rubric sub-scores
  const llmStart = Date.now();
  const llmResult = await evaluateAnswer({
    questionText: question.text,
    expectedAnswer: question.expectedAnswer,
    userAnswer,
    matchedKeywords: keywordResult.matchedKeywords,
    missingKeywords: keywordResult.missingKeywords,
    semanticSimilarity: embeddingResult.similarity,
  });
  const llmLatency = Date.now() - llmStart;

  // STEP 6: Combine scores using dynamic weights (Keyword % + Embedding % + LLM %)
  return blendEvaluationScores({
    question,
    keywordResult,
    embeddingResult,
    llmResult,
    embeddingLatency,
    llmLatency,
    totalLatency: Date.now() - totalStart,
  });
}

export default {
  evaluateAttempt,
};
