# Phase 4 Validation Strategy — Mock Interview Mode

This document details the automated and manual verification checklist for Mock Interview Mode.

## 1. Automated Verification Checks

We will implement `server/src/scripts/test-mock-session.js` which does the following:
- Creates a test user.
- Starts a mock interview session:
  - Asserts that exactly 10 questions are returned.
  - Asserts difficulty split: 3 Easy, 4 Medium, 3 Hard.
  - Asserts topic distribution.
- Saves intermediate answers:
  - Updates 2 answers and queries database to assert they are correctly saved.
- Submits mock interview:
  - Invokes submit endpoint.
  - Verifies that all 10 answers have AI scores, strengths, weaknesses, andSuggestions populated.
  - Asserts session status is updated to `completed` in DB.

**Run command**:
```bash
node server/src/scripts/test-mock-session.js
```

---

## 2. Manual Verification Checklist

1. **Start Screen**:
   - Navigate to `/questions` and assert a "Start Mock Interview" button is visible.
   - Click it, select role, and verify loading state.
2. **Session Workspace**:
   - Verify sidebar listing questions 1 to 10 with status circles (unanswered / saved).
   - Verify 45:00 countdown timer starts ticking.
   - Refresh the page and assert that the timer does not restart but continues ticking correctly.
3. **Answering & Navigation**:
   - Write answers to Question 1 and 2, verify clicking "Next" or sidebar tags saves progress.
   - Verify saved questions have a filled indicator circle in the sidebar.
4. **Auto-Submit on Timeout**:
   - In dev mode, temporarily adjust session length to 10 seconds.
   - Verify session auto-submits and redirects to scorecard when timer hits 0.
5. **Scorecard**:
   - Verify reports page displays total overall score, elapsed time, and per-question score breakdown cards with detailed feedback toggles.
