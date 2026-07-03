# Mockly — AI-Based Interview Preparation Software

## What This Is

Mockly is a web-based interview preparation platform where students practice role-specific interview questions and get their answers evaluated by a local LLM (Llama 3 via Ollama) with personalized feedback, hybrid scoring, and visual progress tracking. It is built using the MERN stack (MongoDB, Express, React, Node.js) and operates entirely on local infrastructure.

## Core Value

Empower students to improve their interview performance through highly analytical, local hybrid evaluation (keyword, vector embedding, and LLM) and structured, actionable feedback with a simulated placement gating flow.

## Requirements

### Validated

*(None yet — ship to validate)*

### Active

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can log in and receive a JWT for session management
- [ ] **AUTH-03**: User session persists via JWT verification across page refreshes
- [ ] **ROLE-01**: System supports dynamic role definitions (SDE, Data Scientist, PM, Data Analyst)
- [ ] **QUES-01**: User can browse questions filtered by role, type, and difficulty
- [ ] **QUES-02**: User can select a specific question to answer
- [ ] **EVAL-01**: Keyword Service extracts and matches key points from answer
- [ ] **EVAL-02**: Embedding Service calculates vector similarity using Ollama embeddings
- [ ] **EVAL-03**: LLM Service prompts Llama 3 for evaluation score
- [ ] **EVAL-04**: Scoring Service computes weighted hybrid score (0.25 keyword, 0.35 embedding, 0.40 LLM)
- [ ] **EVAL-05**: Feedback Service generates structured feedback (Strengths, Weaknesses, Missing Points, Suggestions)
- [ ] **DASH-01**: Score line chart showing progress over time per topic
- [ ] **DASH-02**: Topic radar chart showing weak vs. strong areas
- [ ] **DASH-03**: Statistics cards for total questions, average score, and active sessions
- [ ] **REC-01**: Recommendation engine identifies weak areas and suggests questions
- [ ] **MOCK-01**: Mock interview session creation with 10 questions and 45-minute timer
- [ ] **MOCK-02**: Timer component counts down and auto-submits on timeout
- [ ] **MOCK-03**: Navigation and answer submission within a mock interview session
- [ ] **MOCK-04**: Results report page summarizing performance
- [ ] **GATED-01**: ThreeRoundAttempt model tracking Aptitude -> Technical -> HR progress
- [ ] **GATED-02**: Aptitude Round consisting of MCQs with rule-based scoring (pass threshold 70/100)
- [ ] **GATED-03**: Technical Round with hybrid scoring and difficulty distribution (3 easy, 4 medium, 3 hard)
- [ ] **GATED-04**: HR Round with LLM-heavy scoring
- [ ] **GATED-05**: Round gating logic enforcing Round N+1 access only if Round N is passed
- [ ] **GATED-06**: Retry logic allowing up to 3 attempts per round before locking out
- [ ] **ADM-01**: Route protection ensuring only admin roles access admin endpoints/pages
- [ ] **ADM-02**: Admin dashboard displaying platform-wide statistics (users, questions, average scores)
- [ ] **ADM-03**: Question CRUD operations (add, edit, delete, bulk import)
- [ ] **ADM-04**: Role management operations (add role, update status, soft-delete)
- [ ] **ADM-05**: User progress overview list for tracking student stats
- [ ] **POL-01**: Skeleton loaders and loading state indicators
- [ ] **POL-02**: Rate limiter on AI evaluation endpoints to prevent Ollama abuse
- [ ] **POL-03**: Responsive design layouts for mobile and desktop compatibility
- [ ] **POL-04**: Comprehensive README and local setup instructions (including Ollama Llama 3 setup)

### Out of Scope

- **Voice/Speech Input**: Text-only answers for MVP to reduce initial complexity; speech-to-text deferred to post-release features.
- **Revised Answer Outline**: General before/after answer outlines are excluded; instead, structured feedback will offer specific suggestions.
- **Multi-device session enforcement**: Not critical for initial deployment.
- **Hosted Cloud AI Models**: Restricted to local Llama 3 via Ollama for cost-free, offline execution.

## Context

- Target Audience: 4th-semester Computer Engineering students practicing for placement rounds.
- Local AI environment using Ollama running Llama 3 8B (default).
- Local MongoDB instance and local Node.js server.
- The project is configured as a greenfield monorepo with `client/` and `server/` folders.

## Constraints

- **Stack**: React (Vite) + Tailwind CSS + Recharts (Frontend), Express + Mongoose + JWT + bcrypt (Backend), Ollama + Llama 3 + local embeddings API (Local AI).
- **Environment**: Must run locally on Windows.
- **Local AI Execution**: Ollama calls add latency; client must show clear loading states, and backend needs connection timeout protection.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MERN stack | Standard stack for student projects, simple to scaffold and run locally | ✓ Good |
| Llama 3 8B via Ollama | Runs fully locally, has a standard API, and provides good reasoning for scoring | ✓ Good |
| Hybrid Scoring System | Single-metric evaluation (e.g. keyword match only) is easily gamed or inaccurate; vector similarity + LLM provides balanced assessment | ✓ Good |
| Aptitude -> Tech -> HR Gating | Replicates typical placement filters, helping students experience realistic gating | ✓ Good |
| Admin Panel | Necessary for managing the question bank dynamically without DB direct edits | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-03 after initialization*
