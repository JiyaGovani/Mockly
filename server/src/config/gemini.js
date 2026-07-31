import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Extract and parse API keys (supports comma-separated list of keys for rotation)
const rawKeys = process.env.GEMINI_API_KEY || '';
export const GEMINI_API_KEYS = rawKeys
  .split(',')
  .map(k => k.trim())
  .filter(k => k && k !== 'your_gemini_api_key_here');

export const GEMINI_API_KEY = GEMINI_API_KEYS[0] || '';

// Priority Fallback LLM Models
const rawModels = [
  process.env.GEMINI_MODEL,
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
].filter(Boolean);

// Unique list of fallback models
export const FALLBACK_MODELS = [...new Set(rawModels)];

// Priority Fallback Embedding Models
const rawEmbedModels = [
  process.env.GEMINI_EMBED_MODEL,
  'gemini-embedding-001',
  'gemini-embedding-2',
].filter(Boolean);

export const FALLBACK_EMBED_MODELS = [...new Set(rawEmbedModels)];

if (GEMINI_API_KEYS.length === 0) {
  console.warn('⚠️ Warning: GEMINI_API_KEY is missing or set to placeholder in server/.env file.');
}

/**
 * Returns a GoogleGenerativeAI client instance for a given key index.
 * @param {number} keyIdx 
 */
export function getAIClient(keyIdx = 0) {
  const index = keyIdx % (GEMINI_API_KEYS.length || 1);
  const key = GEMINI_API_KEYS[index] || '';
  return new GoogleGenerativeAI(key);
}

export const genAI = getAIClient(0);

export default {
  apiKeys: GEMINI_API_KEYS,
  fallbackModels: FALLBACK_MODELS,
  fallbackEmbedModels: FALLBACK_EMBED_MODELS,
  getAIClient,
};
