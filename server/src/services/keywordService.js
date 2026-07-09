import natural from 'natural';

const stemmer = natural.PorterStemmer;
const tokenizer = new natural.WordTokenizer();

/**
 * Match user answer tokens against expected key points using stemming.
 * Handles variations in tense, singular/plural, and word forms.
 *
 * @param {string} userAnswer 
 * @param {string[]} keyPoints 
 * @returns {{ score: number, matchedKeywords: string[], missingKeywords: string[] }}
 */
export function matchKeyPoints(userAnswer, keyPoints = []) {
  if (!userAnswer || !keyPoints || keyPoints.length === 0) {
    return {
      score: 0,
      matchedKeywords: [],
      missingKeywords: keyPoints || [],
    };
  }

  // Tokenize and stem user's answer
  const userTokens = tokenizer.tokenize(userAnswer.toLowerCase()) || [];
  const userStems = new Set(userTokens.map(token => stemmer.stem(token)));

  const matchedKeywords = [];
  const missingKeywords = [];

  for (const point of keyPoints) {
    // A keyPoint might contain multiple words (e.g. "binary search tree")
    const pointTokens = tokenizer.tokenize(point.toLowerCase()) || [];
    const pointStems = pointTokens.map(token => stemmer.stem(token));

    // Check if ALL tokens of the key point are matched by some stem in the user answer
    const isMatched = pointStems.length > 0 && pointStems.every(stem => userStems.has(stem));

    if (isMatched) {
      matchedKeywords.push(point);
    } else {
      missingKeywords.push(point);
    }
  }

  const score = keyPoints.length > 0 ? (matchedKeywords.length / keyPoints.length) * 100 : 0;

  return {
    score: Math.round(score),
    matchedKeywords,
    missingKeywords,
  };
}

export default {
  matchKeyPoints,
};
