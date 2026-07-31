# Context: Phase 5 - 3-Round Placement Interview Flow

## Requirements
- GATED-01: ThreeRoundAttempt model tracking Aptitude -> Technical -> HR progress
- GATED-02: Aptitude Round consisting of MCQs with rule-based scoring (pass threshold 70/100)
- GATED-03: Technical Round with hybrid scoring and difficulty distribution (3 easy, 4 medium, 3 hard)
- GATED-04: HR Round with LLM-heavy scoring
- GATED-05: Round gating logic enforcing Round N+1 access only if Round N is passed
- GATED-06: Retry logic allowing up to 3 attempts per round before locking out

## Design Decisions
1. **ThreeRoundAttempt Schema**:
   - `userId`, `roleId`, `status` ('in_progress', 'completed', 'failed', 'locked'), `attemptsCount` (map per round), `currentRound` ('aptitude', 'technical', 'hr').
   - Round details store scores, passed status, and timestamps.
2. **Aptitude Engine**:
   - MCQs pulled for the selected role.
   - Rule-based fast grading (70% cut-off).
3. **Technical Round**:
   - 10 subjective questions (3 Easy, 4 Medium, 3 Hard) scored using the standard hybrid scoring service.
4. **HR Round**:
   - Subjective questions focused on soft skills & behavioral scenarios using LLM-heavy scoring weights.
5. **Gating & Lock Middleware**:
   - Enforce sequential progression. Attempt lock after 3 failed attempts per round.
