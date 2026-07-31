import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
export const GEMINI_EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
  console.warn('⚠️ Warning: GEMINI_API_KEY is missing or set to placeholder in server/.env file.');
}

export const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export default {
  apiKey: GEMINI_API_KEY,
  model: GEMINI_MODEL,
  embedModel: GEMINI_EMBED_MODEL,
  genAI,
};
