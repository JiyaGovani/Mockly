import { getAIClient, GEMINI_API_KEYS, FALLBACK_EMBED_MODELS } from '../config/gemini.js';

/**
 * Fetch vector embedding from Google Gemini embeddings endpoint with Fallback Chain.
 *
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
export async function getEmbedding(text) {
  if (!text || text.trim() === '') {
    return [];
  }

  if (GEMINI_API_KEYS.length === 0) {
    const keyErr = new Error('GEMINI_API_KEY is missing or invalid in server/.env file');
    keyErr.statusCode = 500;
    throw keyErr;
  }

  // Priority Loop: Primary Embedding Model tried across ALL Keys first before falling back
  for (const modelName of FALLBACK_EMBED_MODELS) {
    for (let keyIdx = 0; keyIdx < GEMINI_API_KEYS.length; keyIdx++) {
      const client = getAIClient(keyIdx);
      try {
        const model = client.getGenerativeModel({ model: modelName });
        const result = await model.embedContent(text);

        if (result && result.embedding && Array.isArray(result.embedding.values)) {
          return result.embedding.values;
        }
      } catch (err) {
        lastError = err;
        console.warn(`🔄 AUTO-SWITCH (Embedding): Key #${keyIdx + 1} (${GEMINI_API_KEYS[keyIdx]?.slice(0, 8)}...) / Model '${modelName}' failed with error: [${err.message}]. Trying next model/key...`);
        continue;
      }
    }
  }

  console.error('Error fetching embedding from Gemini API:', lastError?.message);
  throw lastError || new Error('All embedding models exhausted');
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
