import natural from 'natural';

const stemmer = natural.PorterStemmer;
const tokenizer = new natural.WordTokenizer();

// Recognized technical synonyms & abbreviation mappings
const SYNONYM_MAP = {
  fifo: ['first in first out', 'queue behavior'],
  lifo: ['last in first out', 'stack behavior'],
  bfs: ['breadth first search', 'breadth first traversal'],
  dfs: ['depth first search', 'depth first traversal'],
  oop: ['object oriented programming', 'object oriented'],
  dom: ['document object model'],
  rest: ['representational state transfer', 'restful'],
  api: ['application programming interface'],
  sql: ['structured query language', 'relational database query'],
  json: ['javascript object notation'],
  html: ['hypertext markup language'],
  css: ['cascading style sheets'],
  db: ['database', 'datastore'],
  sdk: ['software development kit'],
  pr: ['pull request'],
  jwt: ['json web token'],
  orm: ['object relational mapping'],
};

/**
 * Match user answer tokens against expected key points using stemming & synonym expansion.
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

  const userLower = userAnswer.toLowerCase();
  const userTokens = tokenizer.tokenize(userLower) || [];
  const userStems = new Set(userTokens.map(token => stemmer.stem(token)));

  const matchedKeywords = [];
  const missingKeywords = [];

  for (const point of keyPoints) {
    const pointLower = point.toLowerCase();
    
    // 1. Direct string containment check
    if (userLower.includes(pointLower)) {
      matchedKeywords.push(point);
      continue;
    }

    // 2. Direct abbreviation / synonym dictionary lookup
    const synonymList = SYNONYM_MAP[pointLower] || [];
    let synonymMatched = synonymList.some(syn => userLower.includes(syn));

    // 3. Reverse check (e.g. key point is "First In First Out" and user typed "FIFO")
    if (!synonymMatched) {
      for (const [abbr, syns] of Object.entries(SYNONYM_MAP)) {
        if (syns.some(syn => syn.includes(pointLower) || pointLower.includes(syn))) {
          if (userStems.has(stemmer.stem(abbr)) || userLower.includes(abbr)) {
            synonymMatched = true;
            break;
          }
        }
      }
    }

    if (synonymMatched) {
      matchedKeywords.push(point);
      continue;
    }

    // 4. Tokenized Stem Match
    const pointTokens = tokenizer.tokenize(pointLower) || [];
    const pointStems = pointTokens.map(token => stemmer.stem(token));
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
