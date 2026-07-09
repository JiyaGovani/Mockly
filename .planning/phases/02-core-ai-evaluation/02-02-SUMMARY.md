---
phase: 02-core-ai-evaluation
plan: "02"
subsystem: api
tags: [ollama, qwen, express, mongoose, mongodb]
requires:
  - phase: 02-core-ai-evaluation
    plan: "01"
    provides: Ollama configurations, keyword matching, and cosine similarity services
provides:
  - LLM service calling local Ollama generator
  - PracticeAttempt database model
  - Evaluation Coordinator blending scores (20% keyword, 40% embedding, 40% LLM)
  - /api/evaluation/submit POST route
  - Automated test-eval script
affects:
  - client
tech-stack:
  added: []
  patterns:
    - Parallel execution of keyword extraction and vector similarity
    - Structured JSON LLM response prompt schemas
    - Mongoose persistence for practice attempts
key-files:
  created:
    - server/src/services/llmService.js
    - server/src/models/PracticeAttempt.js
    - server/src/routes/evaluation.js
    - server/src/scripts/test-eval.js
  modified:
    - server/src/services/evaluationCoordinator.js
    - server/src/index.js
    - server/src/models/Question.js
key-decisions:
  - "Decided to run keyword matching and embedding queries in parallel using Promise.all before calling the LLM to optimize backend latency."
  - "Constructed a strict JSON schema prompt to force local LLM (qwen2.5-coder) to output clean JSON directly, bypassing markdown wrappers."
  - "Set relevance threshold at 0.45 cosine similarity to filter out noise, punctuation, and off-topic random text."
patterns-established:
  - "Coordination pipeline: Fetch Question -> Guard Checks -> Parallel (Keyword + Embedding) -> Sequential LLM -> Blend -> Save Attempt -> Respond."
requirements-completed: [EVAL-03, EVAL-04]
duration: 45min
completed: 2026-07-07
---

# Phase 2: Plan 2 Summary

**Evaluation coordinator, LLM generator service, submission API route, and PracticeAttempt logging.**

## Performance

- **Duration:** 45 min
- **Started:** 2026-07-07T16:00:00Z
- **Completed:** 2026-07-07T16:45:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Implemented `llmService.js` to query Ollama generator with strict JSON prompt guidelines.
- Created `PracticeAttempt` Mongoose schema to log student attempts, detailed scores, feedback, and latency metrics.
- Developed `evaluationCoordinator.js` to parallelize keyword/embedding scoring, scale scores via similarity threshold, and blend overall scores.
- Exposed POST `/api/evaluation/submit` API route to process submissions.
- Created local `test-eval.js` verification script.

## Task Commits
1. **Task 1: Build LLM Grading Service with structured prompts** - `cfe67d7` (feat)
2. **Task 2: Build PracticeAttempt model, Evaluation Coordinator, and submit route** - `cfe67d7` (feat)
3. **Task 3: Create automated verification test script** - `cfe67d7` (feat)

## Files Created/Modified
- `server/src/services/llmService.js` - Evaluates responses using local LLM
- `server/src/models/PracticeAttempt.js` - Stores attempt logging
- `server/src/routes/evaluation.js` - Express submit endpoint
- `server/src/scripts/test-eval.js` - CLI testing script
- `server/src/services/evaluationCoordinator.js` - Integrates and blends scores
- `server/src/index.js` - Hooked up routes
- `server/src/models/Question.js` - Cached embedding fields

## Decisions Made
- Used `qwen2.5-coder:7b` as the local evaluation model.
- Added noise filter in `evaluationCoordinator.js` mapping all cosine similarities < 0.45 to 0.

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
- Ollama cold-start response latency was high (up to 30s) on CPU; extended HTTP timeout settings to 120s.

## Next Phase Readiness
Evaluation backend fully operational. Ready to connect client page.
