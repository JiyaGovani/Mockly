# Phase 4 Research — Mock Interview Mode

This document outlines the technical research and specifications for implementing Mock Interview Mode.

## 1. Technical Architecture & Schemas

### Mongoose Model: `InterviewSession`
We will create a new model in `server/src/models/InterviewSession.js` to log active and completed mock sessions:
```javascript
import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  userAnswer: {
    type: String,
    default: ''
  },
  keywordScore: Number,
  embeddingScore: Number,
  llmScore: Number,
  overallScore: Number,
  matchedKeywords: [String],
  missingKeywords: [String],
  strengths: [String],
  weaknesses: [String],
  suggestions: [String]
});

const interviewSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }],
  answers: [answerSchema],
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  overallScore: Number
}, { timestamps: true });

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
export default InterviewSession;
```

---

## 2. API Endpoints Design

### `POST /api/sessions/start`
- **Objective**: Create a new session.
- **Payload**: `{ role: 'SDE' }`
- **Logic**:
  1. Retrieve active questions for the requested role from the Question bank.
  2. Filter by topics (Technical, Behavioral, HR, Aptitude) and difficulties (Easy, Medium, Hard).
  3. Select exactly 10 questions satisfying:
     - 3 Easy, 4 Medium, 3 Hard questions.
     - Spread across the 4 topics:
       - Technical: 4 questions (1 Easy, 2 Medium, 1 Hard)
       - Behavioral: 2 questions (1 Easy, 1 Medium)
       - HR: 2 questions (1 Medium, 1 Hard)
       - Aptitude: 2 questions (1 Easy, 1 Hard)
  4. Save `InterviewSession` document. Return the populated questions list and `startedAt` timestamp to client.

### `PUT /api/sessions/:id/save`
- **Objective**: Intermediate save of answers for state recovery.
- **Payload**: `{ answers: [{ questionId, userAnswer }] }`
- **Logic**: Update the `answers` subdocument in the session record.

### `POST /api/sessions/:id/submit`
- **Objective**: Close session and run AI evaluations.
- **Logic**:
  1. Fetch session. Mark status as `completed` and set `completedAt`.
  2. For each user answer, run the core AI evaluation coordinator pipeline (`evaluateAttempt` consisting of keywords matching, embedding similarity, and LLM rating).
  3. *Optimization*: Execute evaluations concurrently using `Promise.all` or batches to manage Ollama load.
  4. Aggregate overall score: `overallScore = average of all 10 overallScores`.
  5. Save session. Return full scorecard response.

---

## 3. Frontend Timer & Recovery Synchronization

### Timer Hook
- To prevent timer reset on page refresh or browser restarts, the client will fetch the session details (including `startedAt`) upon mounting the practice screen.
- **Client Remaining Time Calculation**:
  ```javascript
  const elapsedSeconds = Math.floor((new Date().getTime() - new Date(startedAt).getTime()) / 1000);
  const remainingSeconds = Math.max(0, (45 * 60) - elapsedSeconds);
  ```
- Decrement the state every second using `setInterval`. If `remainingSeconds === 0`, trigger the submission handler.

---

## 4. Validation Architecture

We will create a verification script `server/src/scripts/test-mock-session.js` to automate mock interview round checks:
- Verifies question selection rules (3 Easy, 4 Medium, 3 Hard).
- Verifies intermediate save routing.
- Verifies final submission evaluation pipelines.
