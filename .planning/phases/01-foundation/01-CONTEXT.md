# Phase 1: Foundation - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Create MERN monorepo layout, implement JWT-based email authentication, define MongoDB schemas, and load initial role/question data.

</domain>

<decisions>
## Implementation Decisions

### Authentication & Session Management
- **D-01:** JWT-based email authentication. The client stores the JWT in `localStorage` under `mockly_token` and attaches it via `Authorization: Bearer <token>` on subsequent API requests.
- **D-02:** Password hashing using `bcryptjs` (salt rounds: 10) in a pre-save hook on the `User` schema.
- **D-03:** Session persistence via `/api/auth/me` endpoint verified on client startup/refresh.

### Data Models & Schemas
- **D-04:** `User` schema contains `name`, `email` (unique, lowercase), `password` (select: false), and `role` (enum: `student`, `admin`, default `student`).
- **D-05:** `Role` schema contains `name` (unique, uppercase), `displayName`, `description`, and `isActive` flag.
- **D-06:** `Question` schema contains `text`, `role` (uppercase, indexed), `type` (enum: `technical`, `behavioral`, `hr`, `aptitude`), `difficulty` (enum: `easy`, `medium`, `hard`), `expectedAnswer`, `keyPoints`, `options` (MCQ choices), `correctOption` (index of correct MCQ choice), and `isActive`.
- **D-07:** Compound index on `Question` for `(role, type, difficulty)` to optimize filtering, and text index on `text` for search queries.

### Database Seeding
- **D-08:** A standalone seeding script `server/src/scripts/seed.js` clears and seeds 4 roles (SDE, DATA SCIENTIST, PM, DATA ANALYST) and 20 sample questions (5 per role).

### Question Browser UI
- **D-09:** Built using React, Tailwind CSS, and Axios. Features role-based tabs, type and difficulty dropdowns, and debounced text search.
- **D-10:** Clicking a question opens a modal displaying metadata and question details. The practice submission flow is disabled, annotated for Phase 2 implementation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 1 Goals and success criteria
- `.planning/REQUIREMENTS.md` — Active authentication and question requirements (AUTH-01, AUTH-02, AUTH-03, ROLE-01, QUES-01, QUES-02)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `client/src/context/AuthContext.jsx` — Provides `user`, `login`, `register`, `logout` context
- `server/src/config/db.js` — Handles MongoDB database connection
- `server/src/middleware/auth.js` — Protects routes requiring authentication

### Established Patterns
- ES Modules used across server code (using `import` / `export`)
- Client page-enter transitions and styling use global CSS custom styles (`index.css`)
- Clean MVC-like folder structure on the server (models, controllers, routes, middleware)

</code_context>

<specifics>
## Specific Ideas

- No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- Practice Answer Submission — Deferred to Phase 2 (Core AI Evaluation)

</deferred>
