import Question from '../models/Question.js';
import { matchKeyPoints } from './keywordService.js';
import { getEmbedding, calculateCosineSimilarity } from './embeddingService.js';
import { evaluateAnswer } from './llmService.js';

/**
 * Coordinates the evaluation pipeline.
 * Runs Keyword and Embedding services in parallel using Promise.all first.
 * Then passes results as context to the LLM service sequentially.
 *
 * @param {object} params 
 * @param {string} params.questionId 
 * @param {string} params.userAnswer 
 * @returns {Promise<object>}
 */
export async function evaluateAttempt({ questionId, userAnswer }) {
  const totalStart = Date.now();

  // 1. Fetch Question
  const question = await Question.findById(questionId);
  if (!question) {
    throw new Error('Question not found');
  }

  // 2. Parallel calculations: Keyword Matching & Embedding Similarity
  const embedStart = Date.now();

  const keywordPromise = Promise.resolve(
    matchKeyPoints(userAnswer, question.keyPoints)
  );

  // Embedding caching check
  const embeddingPromise = (async () => {
    let expectedVec = question.expectedAnswerEmbedding;
    
    // If not cached, generate and cache expected answer embedding
    if (!expectedVec || expectedVec.length === 0) {
      if (question.expectedAnswer) {
        expectedVec = await getEmbedding(question.expectedAnswer);
        if (expectedVec && expectedVec.length > 0) {
          question.expectedAnswerEmbedding = expectedVec;
          await question.save(); // Cache in DB
        }
      }
    }

    const userVec = await getEmbedding(userAnswer);
    const similarity = calculateCosineSimilarity(expectedVec, userVec);
    return {
      similarity,
      score: Math.round(Math.max(0, similarity) * 100),
    };
  })();

  const [keywordResult, embeddingResult] = await Promise.all([
    keywordPromise,
    embeddingPromise,
  ]);

  const embedEnd = Date.now();
  const embeddingLatency = embedEnd - embedStart;

  // 3. Sequential calculation: LLM evaluation (using results from step 2)
  const llmStart = Date.now();
  
  const llmResult = await evaluateAnswer({
    questionText: question.text,
    expectedAnswer: question.expectedAnswer,
    userAnswer,
    matchedKeywords: keywordResult.matchedKeywords,
    missingKeywords: keywordResult.missingKeywords,
    semanticSimilarity: embeddingResult.similarity,
  });

  const llmEnd = Date.now();
  const llmLatency = llmEnd - llmStart;
  const totalLatency = Date.now() - totalStart;

  // 4. Score Blending (0.20 Keyword + 0.40 Embedding + 0.40 LLM)
  const blendedScore =
    0.20 * keywordResult.score +
    0.40 * embeddingResult.score +
    0.40 * llmResult.score;

  // 5. Standardized response payload
  return {
    question: question._id,
    overallScore: Math.round(blendedScore),
    keywordScore: keywordResult.score,
    embeddingScore: embeddingResult.score,
    llmScore: llmResult.score,
    semanticSimilarity: parseFloat(embeddingResult.similarity.toFixed(4)),
    matchedKeywords: keywordResult.matchedKeywords,
    missingKeywords: keywordResult.missingKeywords,
    strengths: llmResult.strengths,
    weaknesses: llmResult.weaknesses,
    missingPoints: llmResult.missingPoints,
    suggestions: llmResult.suggestions,
    latency: {
      embedding: embeddingLatency,
      llm: llmLatency,
      total: totalLatency,
    },
  };
}

export default {
  evaluateAttempt,
};
