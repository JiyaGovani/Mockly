/**
 * ==============================================================================
 * SCORE BLENDER & WEIGHT CALCULATOR
 * ==============================================================================
 * Combines scores from 3 evaluation engines:
 * 1. Keyword Score (Exact terms matching)
 * 2. Embedding Score (Vector Cosine Similarity)
 * 3. Gemini LLM Score (AI model grading)
 *
 * Dynamically adjusts weights based on question type:
 * - Technical Questions: Higher keyword weight (35% Keyword, 35% Embedding, 30% LLM)
 * - Behavioral/HR Questions: Higher semantic weight (10% Keyword, 45% Embedding, 45% LLM)
 * - General/Other: Balanced weight (20% Keyword, 40% Embedding, 40% LLM)
 */

export function blendEvaluationScores({
  question,
  keywordResult,
  embeddingResult,
  llmResult,
  embeddingLatency,
  llmLatency,
  totalLatency,
}) {
  // Default weights
  let keywordWeight = 0.20;
  let embeddingWeight = 0.40;
  let llmWeight = 0.40;

  // Adjust weights according to question category
  if (question.type === 'technical') {
    keywordWeight = 0.35;
    embeddingWeight = 0.35;
    llmWeight = 0.30;
  } else if (question.type === 'behavioral' || question.type === 'hr') {
    keywordWeight = 0.10;
    embeddingWeight = 0.45;
    llmWeight = 0.45;
  }

  // Calculate weighted blended score
  const blendedScore =
    keywordWeight * keywordResult.score +
    embeddingWeight * embeddingResult.score +
    llmWeight * llmResult.score;

  // Return formatted final response payload
  return {
    question: question._id,
    overallScore: Math.round(blendedScore),
    keywordScore: keywordResult.score,
    embeddingScore: embeddingResult.score,
    llmScore: llmResult.score,
    rubric: llmResult.rubric || {
      technicalAccuracy: llmResult.score,
      completeness: llmResult.score,
      clarity: llmResult.score,
    },
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
