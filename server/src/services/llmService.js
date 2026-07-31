import { SchemaType } from '@google/generative-ai';
import { getAIClient, GEMINI_API_KEYS, FALLBACK_MODELS } from '../config/gemini.js';

/**
 * Invoke Google Gemini API with automatic Fallback Model Chain and Key Rotation.
 *
 * @param {object} params 
 * @param {string} params.questionText 
 * @param {string} params.expectedAnswer 
 * @param {string} params.userAnswer 
 * @param {string[]} params.matchedKeywords 
 * @param {string[]} params.missingKeywords 
 * @param {number} params.semanticSimilarity 
 * @returns {Promise<{ score: number, rubric: { technicalAccuracy: number, completeness: number, clarity: number }, strengths: string[], weaknesses: string[], missingPoints: string[], suggestions: string[] }>}
 */
export async function evaluateAnswer({
  questionText,
  expectedAnswer,
  userAnswer,
  matchedKeywords = [],
  missingKeywords = [],
  semanticSimilarity = 0,
}) {
  if (GEMINI_API_KEYS.length === 0) {
    const keyErr = new Error('GEMINI_API_KEY is missing or invalid in server/.env file');
    keyErr.statusCode = 500;
    throw keyErr;
  }

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
Provide sub-scores (0-100) for technical accuracy, completeness, and communication clarity in the rubric object.
If the student's answer is empty, completely incorrect, off-topic, or contains nonsensical noise, you MUST assign a score of 0.
`;

  let lastError = null;

  // Fallback Loop over available API Keys and Priority Models
  for (let keyIdx = 0; keyIdx < GEMINI_API_KEYS.length; keyIdx++) {
    const client = getAIClient(keyIdx);

    for (const modelName of FALLBACK_MODELS) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                score: {
                  type: SchemaType.INTEGER,
                  description: 'Integer rating from 0 to 100 representing answer correctness and depth',
                },
                rubric: {
                  type: SchemaType.OBJECT,
                  properties: {
                    technicalAccuracy: {
                      type: SchemaType.INTEGER,
                      description: 'Sub-score from 0 to 100 for technical correctness of explanations',
                    },
                    completeness: {
                      type: SchemaType.INTEGER,
                      description: 'Sub-score from 0 to 100 for covering essential points from reference answer',
                    },
                    clarity: {
                      type: SchemaType.INTEGER,
                      description: 'Sub-score from 0 to 100 for communication quality and structure',
                    },
                  },
                  required: ['technicalAccuracy', 'completeness', 'clarity'],
                },
                strengths: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                  description: 'List of what the student explained well',
                },
                weaknesses: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                  description: 'List of errors, gaps, or logic problems in the answer',
                },
                missingPoints: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                  description: 'Essential details from expected answer omitted by student',
                },
                suggestions: {
                  type: SchemaType.ARRAY,
                  items: { type: SchemaType.STRING },
                  description: 'Actionable advice to improve their answer',
                },
              },
              required: ['score', 'rubric', 'strengths', 'weaknesses', 'missingPoints', 'suggestions'],
            },
          },
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);
        const rubricObj = parsed.rubric || {};

        return {
          score: Math.min(100, Math.max(0, parseInt(parsed.score) || 0)),
          rubric: {
            technicalAccuracy: Math.min(100, Math.max(0, parseInt(rubricObj.technicalAccuracy) || 0)),
            completeness: Math.min(100, Math.max(0, parseInt(rubricObj.completeness) || 0)),
            clarity: Math.min(100, Math.max(0, parseInt(rubricObj.clarity) || 0)),
          },
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
          missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : [],
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        };
      } catch (err) {
        lastError = err;
        const errMsg = (err.message || '').toLowerCase();

        // Detect 429 Rate Limit / Quota Exceeded / Service Overload
        const isQuotaError = 
          errMsg.includes('429') || 
          errMsg.includes('quota') || 
          errMsg.includes('resource_exhausted') ||
          errMsg.includes('rate limit') ||
          errMsg.includes('503') ||
          errMsg.includes('overloaded');

        if (isQuotaError) {
          console.warn(`⚠️ Model '${modelName}' hit rate limit/quota (Key #${keyIdx + 1}). Auto-switching to fallback model...`);
          continue; // Try next fallback model
        }

        // If model not found (404), try next model in chain
        if (errMsg.includes('404') || errMsg.includes('not found')) {
          console.warn(`⚠️ Model '${modelName}' not found. Trying next fallback model...`);
          continue;
        }

        throw err;
      }
    }
  }

  console.error('All fallback models and API keys exhausted:', lastError?.message);
  throw lastError || new Error('All Gemini evaluation models failed due to rate limits.');
}

export default {
  evaluateAnswer,
};
