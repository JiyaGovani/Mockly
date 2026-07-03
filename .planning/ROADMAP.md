# Roadmap: Mockly

## Overview

Mockly is built in 7 sequential phases starting from the foundational scaffolding, transitioning through the core AI scoring mechanics, visual feedback, mock simulation features, gated evaluation flow, administration, and finally polishing/security.

## Phases

- [ ] **Phase 1: Foundation** - Basic MERN setup, auth, database schema, role definitions, and initial question CRUD.
- [ ] **Phase 2: Core AI Evaluation** - Integrates local Ollama LLM, embeds cosine similarity, and builds the hybrid scoring and feedback pipeline.
- [ ] **Phase 3: Progress Dashboard** - Implements charts showing topic performance over time and a weak-area recommendations system.
- [ ] **Phase 4: Mock Interview Mode** - Implements timed multi-question interview sessions with automated timeout submissions and reports.
- [ ] **Phase 5: 3-Round Interview Flow** - Builds placement simulation flow (Aptitude MCQ -> Tech -> HR) with gating and retry limits.
- [ ] **Phase 6: Admin Panel** - Provides an admin interface to manage questions, roles, and view aggregate user statistics.
- [ ] **Phase 7: Polish & Deploy** - Implements loading states, error boundaries, rate limiting, UI responsiveness, and documentation.

## Phase Details

### Phase 1: Foundation
**Goal**: Create MERN monorepo layout, implement JWT-based email authentication, define MongoDB schemas, and load initial role/question data.
**Depends on**: Nothing
**Requirements**: [AUTH-01, AUTH-02, AUTH-03, ROLE-01, QUES-01, QUES-02]
**Success Criteria**:
  1. User can register and log in on frontend with persistent cookies/tokens.
  2. Question bank is seeded with initial mock data.
  3. Frontend fetches and displays questions filtered by target roles.
**Plans**: 3 plans
Plans:
- [ ] 01-01: Scaffold client (Vite+React+Tailwind) and server (Express+Mongoose) monorepo
- [ ] 01-02: User model, Auth controllers/routes, and login/register UI forms
- [ ] 01-03: Role and Question schemas, seeding script, and client question browser page

### Phase 2: Core AI Evaluation
**Goal**: Build local AI evaluation services using Ollama for keyword matching, vector embeddings similarity, and LLM rating.
**Depends on**: Phase 1
**Requirements**: [EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05]
**Success Criteria**:
  1. Answer submission API scores user's answer from 0-100.
  2. Scoring blends keywords, embeddings cosine similarity, and LLM reasoning.
  3. Feedback displays strengths, weaknesses, missing points, and tips.
**Plans**: 3 plans
Plans:
- [ ] 02-01: Ollama configuration, keyword service, and cosine similarity embeddings service
- [ ] 02-02: LLM grading service, prompt templates, and overall scoring coordinator
- [ ] 02-03: Practice question page with answering text area, score details, and feedback cards

### Phase 3: Progress Dashboard
**Goal**: Implement student progress tracker with data visualization and tailored recommendations.
**Depends on**: Phase 2
**Requirements**: [DASH-01, DASH-02, DASH-03, REC-01]
**Success Criteria**:
  1. Dashboard displays line charts for score trend and radar charts for topic mastery.
  2. System suggests three recommended questions from user's weakest topics.
**Plans**: 2 plans
Plans:
- [ ] 03-01: Dashboard stats & timeseries aggregation APIs, with Recharts visual charts
- [ ] 03-02: Recommendation engine logic and frontend recommendation section

### Phase 4: Mock Interview Mode
**Goal**: Implement timed multi-question interview sessions mimicking real-world pressure.
**Depends on**: Phase 3
**Requirements**: [MOCK-01, MOCK-02, MOCK-03, MOCK-04]
**Success Criteria**:
  1. User can start a timed 10-question mock interview session.
  2. Active sessions auto-submit answers and complete when countdown timer hits zero.
  3. Completion generates a complete summary scorecard with per-question breakdowns.
**Plans**: 2 plans
Plans:
- [ ] 04-01: InterviewSession model, session manager backend APIs, and session timer hooks
- [ ] 04-02: Mock interview UI flow, question navigations, and post-session report cards

### Phase 5: 3-Round Interview Flow
**Goal**: Add placement simulation flow (Aptitude -> Technical -> HR) with gating thresholds.
**Depends on**: Phase 4
**Requirements**: [GATED-01, GATED-02, GATED-03, GATED-04, GATED-05, GATED-06]
**Success Criteria**:
  1. User cannot select Technical round before passing Aptitude, nor HR before Technical.
  2. Aptitude round uses MCQ-based scoring; Technical and HR rounds utilize hybrid scoring with balanced difficulties.
  3. User has a limit of 3 retry attempts per round before locking.
**Plans**: 2 plans
Plans:
- [ ] 05-01: ThreeRoundAttempt model, Aptitude MCQ engine backend, and round gating middleware
- [ ] 05-02: Interactive 3-round frontend screens (Aptitude test, Technical/HR flow, gates) and retry logic

### Phase 6: Admin Panel
**Goal**: Create administration dashboard for system maintenance, question CRUD, and user monitoring.
**Depends on**: Phase 5
**Requirements**: [ADM-01, ADM-02, ADM-03, ADM-04, ADM-05]
**Success Criteria**:
  1. Non-admin users are rejected from accessing admin routes/endpoints.
  2. Admin can create, read, update, delete questions, and toggle role active statuses.
  3. Admin can view aggregate user metrics and list individual student progress logs.
**Plans**: 2 plans
Plans:
- [ ] 06-01: Admin checks middleware, stats aggregators, and users progress viewer UI
- [ ] 06-02: ManageQuestions CRUD UI forms and ManageRoles UI page

### Phase 7: Polish & Deploy
**Goal**: Apply finishing UX polishes, add API rate limiting, refine mobile layouts, and prepare documentation.
**Depends on**: Phase 6
**Requirements**: [POL-01, POL-02, POL-03, POL-04]
**Success Criteria**:
  1. API requests to AI grading are rate-limited.
  2. UI features loading skeletons for all AI/DB fetches.
  3. Comprehensive README describes installation and local Ollama setup.
**Plans**: 2 plans
Plans:
- [ ] 07-01: Rate limiting, loading skeletons, error boundaries, and responsiveness checks
- [ ] 07-02: Expanding question seed bank and completing project README / setup instructions

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/3 | Not started | - |
| 2. Core AI Evaluation | 0/3 | Not started | - |
| 3. Progress Dashboard | 0/2 | Not started | - |
| 4. Mock Interview Mode | 0/2 | Not started | - |
| 5. 3-Round Interview Flow | 0/2 | Not started | - |
| 6. Admin Panel | 0/2 | Not started | - |
| 7. Polish & Deploy | 0/2 | Not started | - |
