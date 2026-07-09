# Phase 4 Context — Mock Interview Mode

## Domain Boundary
Phase 4 focuses on implementing the timed, multi-question Mock Interview Mode. Students can launch a simulated round of 10 questions under a 45-minute countdown constraint, yielding a full report card at the end.

## Decisions

### 1. Question Selection & Difficulty Distribution
- **Choice**: Balanced Split (3 Easy, 4 Medium, 3 Hard)
- **Detail**: The system will automatically select exactly 10 active questions matching the user's target job role. The difficulty will be distributed as 3 Easy, 4 Medium, and 3 Hard questions. Topics will be spread out across Technical, Behavioral, HR, and Aptitude.

### 2. Evaluation Timing
- **Choice**: End-of-Session Scorecard
- **Detail**: Answers are not evaluated in real-time. Once the user starts the session, they type and save answers. Background AI evaluation runs only after they submit the session or when the 45-minute timer expires. This avoids latency bottlenecks during the interview.

### 3. Session Navigation
- **Choice**: Free Navigation
- **Detail**: Users can browse the 10 questions in any order. A sidebar displaying questions 1-10 will allow direct jumping. Users can write, edit, and update answers for any question before clicking the final submit button.

### 4. Recovery & Exit Policy
- **Choice**: Session State Recovery
- **Detail**: Active session states (answers, start timestamp) are saved to the MongoDB database. If the browser tab is closed, page is refreshed, or connection drops, the user can resume their session. The remaining time is calculated relative to the original start timestamp to prevent cheating.

---

## Canonical Refs
- [PROJECT.md](../../PROJECT.md)
- [REQUIREMENTS.md](../../REQUIREMENTS.md)
