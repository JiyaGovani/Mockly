import { genAI, GEMINI_EMBED_MODEL, GEMINI_API_KEY } from '../config/gemini.js';

/**
 * Fetch vector embedding from Google Gemini embeddings endpoint (text-embedding-004).
 *
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
export async function getEmbedding(text) {
  if (!text || text.trim() === '') {
    return [];
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    const keyErr = new Error('GEMINI_API_KEY is missing or invalid in server/.env file');
    keyErr.statusCode = 500;
    throw keyErr;
  }

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_EMBED_MODEL });
    const result = await model.embedContent(text);

    if (result && result.embedding && Array.isArray(result.embedding.values)) {
      return result.embedding.values;
    }
    throw new Error('Invalid embedding response from Gemini API');
  } catch (err) {
    console.error('Error fetching embedding from Gemini API:', err.message);
    throw err;
  }
}

/**
 * Calculates the cosine similarity between two numeric vectors.
 *
 * @param {number[]} vecA 
 * @param {number[]} vecB 
 * @returns {number} similarity score (0 to 1)
 */
export function calculateCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) {
    return 0;
  }
  if (vecA.length !== vecB.length) {
    throw new Error(`Vector lengths do not match: ${vecA.length} vs ${vecB.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export default {
  getEmbedding,
  calculateCosineSimilarity,
};
