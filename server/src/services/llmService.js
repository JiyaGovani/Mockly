import axios from 'axios';
import { OLLAMA_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT } from '../config/ollama.js';

/**
 * Invoke local Llama 3 via Ollama to evaluate the user's answer.
 * Uses structured prompts and enforces strict JSON schema output.
 *
 * @param {object} params 
 * @param {string} params.questionText 
 * @param {string} params.expectedAnswer 
 * @param {string} params.userAnswer 
 * @param {string[]} params.matchedKeywords 
 * @param {string[]} params.missingKeywords 
 * @param {number} params.semanticSimilarity 
 * @returns {Promise<{ score: number, strengths: string[], weaknesses: string[], missingPoints: string[], suggestions: string[] }>}
 */
export async function evaluateAnswer({
  questionText,
  expectedAnswer,
  userAnswer,
  matchedKeywords = [],
  missingKeywords = [],
  semanticSimilarity = 0,
}) {
  const similarityPercent = Math.round(semanticSimilarity * 100);

  const prompt = `
You are an expert technical interviewer evaluating a student's response to the following question.

[Question]
${questionText}

[Expected Reference Answer]
${expectedAnswer}

[Student's Answer]
${userAnswer}

[Pre-calculated Metrics (for your reference)]
- Keywords Matched: ${matchedKeywords.join(', ') || 'None'}
- Keywords Missing: ${missingKeywords.join(', ') || 'None'}
- Semantic Cosine Similarity: ${similarityPercent}%

Evaluate the student's answer based on the reference answer and pre-calculated metrics.
Provide constructive, direct, technical feedback.

You MUST respond with ONLY a valid, raw JSON object matching the schema below.
DO NOT wrap the response in markdown blocks (e.g. do NOT use \`\`\`json).
DO NOT include any conversational text, warnings, explanations, or extra characters.

JSON Schema:
{
  "score": 85, // Integer rating from 0 to 100 representing answer correctness and depth
  "strengths": ["list of what they explained well"],
  "weaknesses": ["list of errors, gaps, or logic problems"],
  "missingPoints": ["essential details from expected answer they omitted"],
  "suggestions": ["actionable advice to improve their answer"]
}
`;

  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1, // low temperature for deterministic evaluation
        },
        format: 'json',
      },
      {
        timeout: OLLAMA_TIMEOUT,
      }
    );

    if (response.data && response.data.response) {
      const responseText = response.data.response.trim();
      try {
        const parsed = JSON.parse(responseText);
        return {
          score: Math.min(100, Math.max(0, parseInt(parsed.score) || 0)),
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
          missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : [],
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        };
      } catch (parseErr) {
        console.warn('Ollama JSON parse failed. Raw response:', responseText);
        // Fallback parsing strategy to avoid crashing
        let score = 0;
        const scoreMatch = responseText.match(/"score"\s*:\s*(\d+)/i);
        if (scoreMatch) {
          score = Math.min(100, Math.max(0, parseInt(scoreMatch[1]) || 0));
        }

        return {
          score: score,
          strengths: [],
          weaknesses: [],
          missingPoints: ['Failed to parse structured feedback due to response format.'],
          suggestions: [responseText.substring(0, 300)], // output snippet for debugging
        };
      }
    }
    throw new Error('Empty response from Ollama generate API');
  } catch (err) {
    console.error('Error invoking Ollama LLM service:', err.message);
    if (err.code === 'ECONNREFUSED') {
      const offlineErr = new Error('Ollama service offline');
      offlineErr.statusCode = 503;
      throw offlineErr;
    }
    if (err.response?.status === 404) {
      const modelErr = new Error(`LLM model '${OLLAMA_MODEL}' not found`);
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

export default {
  evaluateAnswer,
};
