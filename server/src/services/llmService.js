import { SchemaType } from '@google/generative-ai';
import { genAI, GEMINI_MODEL, GEMINI_API_KEY } from '../config/gemini.js';

/**
 * Invoke Google Gemini API to evaluate the user's answer.
 * Uses structured prompts and enforces strict JSON schema output via responseSchema.
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
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
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
If the student's answer is empty, completely incorrect, off-topic, or contains nonsensical noise, you MUST assign a score of 0.
`;

  try {
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
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
          required: ['score', 'strengths', 'weaknesses', 'missingPoints', 'suggestions'],
        },
      },
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const parsed = JSON.parse(responseText);
    return {
      score: Math.min(100, Math.max(0, parseInt(parsed.score) || 0)),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  } catch (err) {
    console.error('Error invoking Gemini LLM service:', err.message);
    throw err;
  }
}

export default {
  evaluateAnswer,
};
