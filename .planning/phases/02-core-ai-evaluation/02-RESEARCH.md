# Phase 2: Core AI Evaluation - Research

This document outlines the technical research and architecture requirements for building the local AI evaluation pipeline using Ollama and the `natural` library.

## Ollama API Integration

Ollama runs locally as a background service and exposes a REST API at `http://localhost:11434`.

### 1. Generating Embeddings
- **Endpoint:** `POST /api/embeddings`
- **Payload:**
  ```json
  {
    "model": "nomic-embed-text",
    "prompt": "The expected or user answer text goes here."
  }
  ```
- **Response:**
  ```json
  {
    "embedding": [0.0123, -0.0456, 0.789, ...]
  }
  ```

### 2. LLM Text Generation
- **Endpoint:** `POST /api/generate`
- **Payload:**
  ```json
  {
    "model": "llama3",
    "prompt": "System prompt + context + rubric + user answer",
    "stream": false,
    "options": {
      "temperature": 0.2
    },
    "format": "json"
  }
  ```
- **Response:**
  ```json
  {
    "response": "{\"score\": 85, \"feedback\": {\"strengths\": \"...\", \"weaknesses\": \"...\", \"missingPoints\": \"...\", \"suggestions\": \"...\"}}"
  }
  ```

---

## Cosine Similarity Calculations

Cosine similarity measures the cosine of the angle between two multi-dimensional vectors.
Formula:
$$\text{similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$

### JavaScript Implementation
```javascript
export function calculateCosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must be of the same length');
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
```

---

## Stemming and Tokenization via `natural`

To match keywords reliably without being sensitive to verb tenses or singular/plural forms, we will use the `natural` library.

### Installation
```bash
npm install natural --workspace server
```

### Keyword Stemming Matching Logic
```javascript
import natural from 'natural';

const stemmer = natural.PorterStemmer;
const tokenizer = new natural.WordTokenizer();

export function matchKeyPoints(userAnswer, keyPoints) {
  // Tokenize and stem user answer
  const userTokens = tokenizer.tokenize(userAnswer.toLowerCase());
  const userStems = new Set(userTokens.map(token => stemmer.stem(token)));

  let matchedCount = 0;
  const matchedPoints = [];

  for (const point of keyPoints) {
    // Stem the key point (might be multiple words)
    const pointTokens = tokenizer.tokenize(point.toLowerCase());
    const pointStems = pointTokens.map(token => stemmer.stem(token));

    // Check if all stems of the key point are present in the user stems
    const isMatched = pointStems.every(stem => userStems.has(stem));
    if (isMatched) {
      matchedCount++;
      matchedPoints.push(point);
    }
  }

  return {
    score: (matchedCount / keyPoints.length) * 100 || 0,
    matchedCount,
    totalCount: keyPoints.length,
    matchedPoints
  };
}
```

---

## Validation Architecture

To verify the evaluation services, we must create tests in `server/src/scripts/test-eval.js` that:
1. Fetch a question from the database.
2. Call the keyword matching service.
3. Call the embedding service and calculate similarity.
4. Call the LLM service with Llama 3.
5. Print the breakdown of the hybrid scores and the structured feedback.
