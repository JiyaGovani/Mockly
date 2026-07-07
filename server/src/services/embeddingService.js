import axios from 'axios';
import { OLLAMA_URL, OLLAMA_EMBED_MODEL, OLLAMA_TIMEOUT } from '../config/ollama.js';

/**
 * Fetch vector embedding from local Ollama embeddings endpoint.
 *
 * @param {string} text 
 * @returns {Promise<number[]>}
 */
export async function getEmbedding(text) {
  if (!text || text.trim() === '') {
    return [];
  }

  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/embeddings`,
      {
        model: OLLAMA_EMBED_MODEL,
        prompt: text,
      },
      {
        timeout: OLLAMA_TIMEOUT,
      }
    );

    if (response.data && response.data.embedding) {
      return response.data.embedding;
    }
    throw new Error('Invalid embedding response from Ollama');
  } catch (err) {
    console.error('Error fetching embedding from Ollama:', err.message);
    // Propagate standard error details for routing error handling
    if (err.code === 'ECONNREFUSED') {
      const offlineErr = new Error('Ollama service offline');
      offlineErr.statusCode = 503;
      throw offlineErr;
    }
    if (err.response?.status === 404) {
      const modelErr = new Error(`Embedding model '${OLLAMA_EMBED_MODEL}' not found`);
      modelErr.statusCode = 404;
      throw modelErr;
    }
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      const timeoutErr = new Error('Inference request timed out');
      timeoutErr.statusCode = 504;
      throw timeoutErr;
    }
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
