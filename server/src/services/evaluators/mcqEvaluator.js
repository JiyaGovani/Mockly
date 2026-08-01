/**
 * ==============================================================================
 * MCQ EVALUATOR SERVICE
 * ==============================================================================
 * Grades Multiple Choice Questions (MCQs) instantly without calling LLM.
 * Supports:
 * - Option text matching (exact or substring)
 * - Letter matching ('A', 'B', 'C', 'D' or 'Option A')
 * - Index matching (0-indexed or 1-indexed)
 */

// Helper to check if a question object has valid MCQ options and correct answer index
export function checkIsMcq(question) {
  const hasOptions = Array.isArray(question.options) && question.options.length > 0;
  const hasCorrectOption =
    typeof question.correctOption === 'number' &&
    question.correctOption >= 0 &&
    question.correctOption < (hasOptions ? question.options.length : 4);
  return hasOptions && hasCorrectOption;
}

// Grades user's MCQ answer and returns a complete evaluation response object
export function evaluateMcq(question, userAnswer, totalStart) {
  const rawTrimmed = (userAnswer || '').trim();
  const correctIdx = question.correctOption;
  const correctText = question.options[correctIdx].trim();
  const correctLetter = String.fromCharCode(65 + correctIdx); // Converts index 0 -> 'A', 1 -> 'B', etc.

  let isCorrect = false;
  const userLower = rawTrimmed.toLowerCase();
  const correctLower = correctText.toLowerCase();

  // 1. Text match: Check if user typed the option text
  if (userLower.includes(correctLower) || (userLower.length >= 3 && correctLower.includes(userLower))) {
    isCorrect = true;
  }
  // 2. Letter match: Check if user typed 'A', 'B', 'C', 'D' or 'Option A'
  else if (
    userLower === correctLetter.toLowerCase() ||
    new RegExp(`^option\\s*${correctLetter}$`, 'i').test(rawTrimmed) ||
    new RegExp(`^${correctLetter}[\\)\\.:\\s]`, 'i').test(rawTrimmed)
  ) {
    isCorrect = true;
  }
  // 3. Numeric match: Check if user typed '0' or '1' as index
  else {
    const numMatch = rawTrimmed.match(/^\d+$/);
    if (numMatch) {
      const val = parseInt(numMatch[0]);
      if (val === correctIdx || val === correctIdx + 1) {
        isCorrect = true;
      }
    }
  }

  // Safety check: Ensure user didn't explicitly pick a WRONG option (e.g. user typed "A" when correct is "B")
  if (isCorrect) {
    for (let i = 0; i < question.options.length; i++) {
      if (i !== correctIdx) {
        const wrongText = question.options[i].trim().toLowerCase();
        const wrongLetter = String.fromCharCode(65 + i);
        if (
          userLower === wrongLetter.toLowerCase() ||
          userLower === wrongText ||
          new RegExp(`^option\\s*${wrongLetter}$`, 'i').test(rawTrimmed)
        ) {
          isCorrect = false;
          break;
        }
      }
    }
  }

  const score = isCorrect ? 100 : 0;
  const totalLatency = Date.now() - totalStart;

  // Return standard response structure
  return {
    question: question._id,
    isMcq: true,
    overallScore: score,
    keywordScore: score,
    embeddingScore: score,
    llmScore: score,
    rubric: {
      technicalAccuracy: score,
      completeness: score,
      clarity: 100,
    },
    semanticSimilarity: isCorrect ? 1.0 : 0.0,
    matchedKeywords: [],
    missingKeywords: [],
    strengths: isCorrect ? [`Correct option selected! (${correctLetter}: ${correctText})`] : [],
    weaknesses: isCorrect ? [] : ['Selected option is incorrect.'],
    missingPoints: isCorrect ? [] : [`Correct answer is Option ${correctLetter}: "${correctText}"`],
    suggestions: isCorrect
      ? ['Great job! Your selection matches the correct answer.']
      : [`Review why Option ${correctLetter} ("${correctText}") is the correct choice.`],
    latency: {
      embedding: 0,
      llm: 0,
      total: totalLatency,
    },
  };
}
