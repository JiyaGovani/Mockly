# Requirements: Mockly

**Defined:** 2026-07-03
**Core Value:** Empower students to improve their interview performance through highly analytical, local hybrid evaluation (keyword, vector embedding, and LLM) and structured, actionable feedback with a simulated placement gating flow.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication
- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can log in and receive a JWT for session management
- [ ] **AUTH-03**: User session persists via JWT verification across page refreshes

### Roles & Questions
- [ ] **ROLE-01**: System supports dynamic role definitions (SDE, Data Scientist, PM, Data Analyst)
- [ ] **QUES-01**: User can browse questions filtered by role, type, and difficulty
- [ ] **QUES-02**: User can select a specific question to answer

### Evaluation Pipeline (Local AI)
- [ ] **EVAL-01**: Keyword Service extracts and matches key points from answer
- [ ] **EVAL-02**: Embedding Service calculates vector similarity using Ollama embeddings API
- [ ] **EVAL-03**: LLM Service prompts Llama 3 for evaluation score (0-100)
- [ ] **EVAL-04**: Scoring Service computes weighted hybrid score (0.25 keyword + 0.35 embedding + 0.40 LLM)
- [ ] **EVAL-05**: Feedback Service generates structured feedback (Strengths, Weaknesses, Missing Points, Suggestions)

### Progress Dashboard
- [ ] **DASH-01**: Score line chart showing progress over time per topic
- [ ] **DASH-02**: Topic radar chart showing weak vs. strong areas
- [ ] **DASH-03**: Statistics cards for total questions, average score, and active sessions

### Question Recommendations
- [ ] **REC-01**: Recommendation engine identifies weak areas and suggests questions

### Mock Interview Mode
- [ ] **MOCK-01**: Mock interview session creation with 10 questions and 45-minute timer
- [ ] **MOCK-02**: Timer component counts down and auto-submits on timeout
- [ ] **MOCK-03**: Navigation and answer submission within a mock interview session
- [ ] **MOCK-04**: Results report page summarizing performance

### Gated placement Flow
- [ ] **GATED-01**: ThreeRoundAttempt model tracking Aptitude -> Technical -> HR progress
- [ ] **GATED-02**: Aptitude Round consisting of MCQs with rule-based scoring (pass threshold 70/100)
- [ ] **GATED-03**: Technical Round with hybrid scoring and difficulty distribution (3 easy, 4 medium, 3 hard)
- [ ] **GATED-04**: HR Round with LLM-heavy scoring
- [ ] **GATED-05**: Round gating logic enforcing Round N+1 access only if Round N is passed
- [ ] **GATED-06**: Retry logic allowing up to 3 attempts per round before locking out

### Admin Panel
- [ ] **ADM-01**: Route protection ensuring only admin roles access admin endpoints/pages
- [ ] **ADM-02**: Admin dashboard displaying platform-wide statistics (users, questions, average scores)
- [ ] **ADM-03**: Question CRUD operations (add, edit, delete, bulk import)
- [ ] **ADM-04**: Role management operations (add role, update status, soft-delete)
- [ ] **ADM-05**: User progress overview list for tracking student stats

### Polish & Integration
- [ ] **POL-01**: Skeleton loaders and loading state indicators for async operations
- [ ] **POL-02**: Rate limiter on AI evaluation endpoints to prevent Ollama abuse
- [ ] **POL-03**: Responsive design layouts for mobile and desktop compatibility
- [ ] **POL-04**: Comprehensive README and local setup instructions (including Ollama Llama 3 setup)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Voice & Speech
- **VOIC-01**: Speech-to-text integration using Web Speech API for voice-based answers
- **VOIC-02**: Audio level visualizer during recording

### AI Extensions
- **AIEX-01**: Generator for before/after revised answer outlines
- **AIEX-02**: Local model fine-tuning guidance or automatic prompt adjustments

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-device session limit | Out of scope for local deployment; added complexity |
| Cloud AI Integration | Restricting to Ollama Llama 3 running locally to save costs and run offline |
| Real-time video check | High complexity; focus is strictly text-based question answering |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| ROLE-01 | Phase 1 | Pending |
| QUES-01 | Phase 1 | Pending |
| QUES-02 | Phase 1 | Pending |
| EVAL-01 | Phase 2 | Pending |
| EVAL-02 | Phase 2 | Pending |
| EVAL-03 | Phase 2 | Pending |
| EVAL-04 | Phase 2 | Pending |
| EVAL-05 | Phase 2 | Pending |
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 3 | Pending |
| DASH-03 | Phase 3 | Pending |
| REC-01 | Phase 3 | Pending |
| MOCK-01 | Phase 4 | Pending |
| MOCK-02 | Phase 4 | Pending |
| MOCK-03 | Phase 4 | Pending |
| MOCK-04 | Phase 4 | Pending |
| GATED-01 | Phase 5 | Pending |
| GATED-02 | Phase 5 | Pending |
| GATED-03 | Phase 5 | Pending |
| GATED-04 | Phase 5 | Pending |
| GATED-05 | Phase 5 | Pending |
| GATED-06 | Phase 5 | Pending |
| ADM-01 | Phase 6 | Pending |
| ADM-02 | Phase 6 | Pending |
| ADM-03 | Phase 6 | Pending |
| ADM-04 | Phase 6 | Pending |
| ADM-05 | Phase 6 | Pending |
| POL-01 | Phase 7 | Pending |
| POL-02 | Phase 7 | Pending |
| POL-03 | Phase 7 | Pending |
| POL-04 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 34 total
- Mapped to phases: 34
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-03*
*Last updated: 2026-07-03 after initial definition*
