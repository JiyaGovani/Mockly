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

  // Priority Loop: Primary Best Model tried across ALL Keys first before falling back
  for (const modelName of FALLBACK_MODELS) {
    for (let keyIdx = 0; keyIdx < GEMINI_API_KEYS.length; keyIdx++) {
      const client = getAIClient(keyIdx);
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
        console.warn(`🔄 AUTO-SWITCH: Key #${keyIdx + 1} (${GEMINI_API_KEYS[keyIdx]?.slice(0, 8)}...) / Model '${modelName}' failed with error: [${err.message}]. Trying next model/key...`);
        continue;
      }
    }
  }

  console.error('All fallback models and API keys exhausted:', lastError?.message);
  throw lastError || new Error('All Gemini evaluation models failed due to rate limits.');
}

/**
 * Evaluate multiple student answers in 1 SINGLE Gemini API Call with Key Rotation & Fallbacks.
 *
 * @param {object} params
 * @param {Array<{ questionId: string, questionText: string, expectedAnswer: string, userAnswer: string, matchedKeywords: string[], missingKeywords: string[], semanticSimilarity: number }>} params.items
 * @returns {Promise<Map<string, { score: number, rubric: object, strengths: string[], weaknesses: string[], missingPoints: string[], suggestions: string[] }>>}
 */
export async function evaluateBatchAnswers({ items = [] }) {
  if (items.length === 0) return new Map();

  if (GEMINI_API_KEYS.length === 0) {
    const keyErr = new Error('GEMINI_API_KEY is missing or invalid in server/.env file');
    keyErr.statusCode = 500;
    throw keyErr;
  }

  const formattedItems = items.map((item, idx) => {
    const similarityPercent = Math.round((item.semanticSimilarity || 0) * 100);
    return `
--- QUESTION ITEM #${idx + 1} ---
[Question ID]: ${item.questionId}
[Question Text]: ${item.questionText}
[Expected Reference Answer]: ${item.expectedAnswer}
[Student's Answer]: ${item.userAnswer}
[Keywords Matched]: ${item.matchedKeywords.join(', ') || 'None'}
[Keywords Missing]: ${item.missingKeywords.join(', ') || 'None'}
[Semantic Cosine Similarity]: ${similarityPercent}%
`;
  }).join('\n');

  const prompt = `
You are an expert technical interviewer evaluating a student's responses for a mock interview session.
You are given a list of interview question items with the question, reference answer, student's answer, and pre-calculated keyword/semantic similarity metrics.

For EACH item, provide thorough, constructive technical feedback.
Ensure sub-scores (0-100) for technicalAccuracy, completeness, and communication clarity are generated in the rubric object.
Provide 2-3 specific bullet points for strengths, weaknesses, missingPoints, and actionable suggestions.
If an answer is empty, off-topic, or nonsensical, assign a score of 0.

Evaluate all ${items.length} items below and return the evaluations in the required JSON schema format matching each questionId.

${formattedItems}
`;

  let lastError = null;

  // Priority Loop: Primary Best Model tried across ALL Keys first before falling back
  for (const modelName of FALLBACK_MODELS) {
    for (let keyIdx = 0; keyIdx < GEMINI_API_KEYS.length; keyIdx++) {
      const client = getAIClient(keyIdx);
      try {
        console.log(`🤖 Attempting Batch AI Evaluation with Key #${keyIdx + 1} (${GEMINI_API_KEYS[keyIdx].slice(0, 8)}...) using model '${modelName}'...`);

        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                evaluations: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      questionId: {
                        type: SchemaType.STRING,
                        description: 'The exact questionId from the input item',
                      },
                      score: {
                        type: SchemaType.INTEGER,
                        description: 'Overall score from 0 to 100',
                      },
                      rubric: {
                        type: SchemaType.OBJECT,
                        properties: {
                          technicalAccuracy: { type: SchemaType.INTEGER },
                          completeness: { type: SchemaType.INTEGER },
                          clarity: { type: SchemaType.INTEGER },
                        },
                        required: ['technicalAccuracy', 'completeness', 'clarity'],
                      },
                      strengths: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                      },
                      weaknesses: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                      },
                      missingPoints: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                      },
                      suggestions: {
                        type: SchemaType.ARRAY,
                        items: { type: SchemaType.STRING },
                      },
                    },
                    required: ['questionId', 'score', 'rubric', 'strengths', 'weaknesses', 'missingPoints', 'suggestions'],
                  },
                },
              },
              required: ['evaluations'],
            },
          },
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const parsed = JSON.parse(responseText);
        const evalList = Array.isArray(parsed.evaluations) ? parsed.evaluations : [];

        console.log(`✅ Batch AI Evaluation SUCCEEDED using Key #${keyIdx + 1} and model '${modelName}'! Evaluated ${evalList.length} items.`);

        const resultMap = new Map();
        for (const ev of evalList) {
          const rubricObj = ev.rubric || {};
          resultMap.set(ev.questionId, {
            score: Math.min(100, Math.max(0, parseInt(ev.score) || 0)),
            rubric: {
              technicalAccuracy: Math.min(100, Math.max(0, parseInt(rubricObj.technicalAccuracy) || 0)),
              completeness: Math.min(100, Math.max(0, parseInt(rubricObj.completeness) || 0)),
              clarity: Math.min(100, Math.max(0, parseInt(rubricObj.clarity) || 0)),
            },
            strengths: Array.isArray(ev.strengths) ? ev.strengths : [],
            weaknesses: Array.isArray(ev.weaknesses) ? ev.weaknesses : [],
            missingPoints: Array.isArray(ev.missingPoints) ? ev.missingPoints : [],
            suggestions: Array.isArray(ev.suggestions) ? ev.suggestions : [],
          });
        }

        return resultMap;
      } catch (err) {
        lastError = err;
        console.warn(`🔄 AUTO-SWITCH: Key #${keyIdx + 1} (${GEMINI_API_KEYS[keyIdx]?.slice(0, 8)}...) / Model '${modelName}' failed with error: [${err.message}]. Trying next model/key...`);
        continue;
      }
    }
  }

  console.error('All fallback models and API keys exhausted for batch evaluation:', lastError?.message);
  throw lastError || new Error('All Gemini evaluation models failed during batch evaluation.');
}

export default {
  evaluateAnswer,
  evaluateBatchAnswers,
};
