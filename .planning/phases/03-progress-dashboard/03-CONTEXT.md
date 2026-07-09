# Phase 3: Progress Dashboard - Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement student progress tracker dashboard with data visualization (progress line charts and radar charts) and a question recommendation engine based on topic mastery performance.

</domain>

<decisions>
## Implementation Decisions

### Chart Aggregation & Visualizations
- **D-01:** Line Chart (Progress over time): Plot user scores chronologically by sequential attempts (Attempt 1, Attempt 2, etc.) rather than daily/weekly averages, to clearly show immediate improvement.
- **D-02:** Radar Chart (Topic Mastery): Represent topic strengths and weaknesses using a multi-axis radar chart showing average scores across different topics.
- **D-03:** Statistics Cards: Display total questions practiced, average score across all attempts, and active/completed mock interview sessions (where applicable).
- **D-04:** Time Filtering: Implement an interactive time range dropdown filter supporting "Last 7 Days", "Last 30 Days", and "All-Time" constraints on both the line chart and statistical card calculations.

### Recommendation Engine Heuristics
- **D-05:** Weak Topic Identification: Prioritize unattempted topics first (topics where the user has zero attempts), followed by topics with the lowest average score.
- **D-06:** Recommendation Distribution: Suggest exactly 3 questions in total, distributed across the top 3 weakest topics (1 question per topic).

### tech-stack & Libraries
- **D-07:** Use **Recharts** library for React to render line and radar charts.
- **D-08:** Backend aggregate APIs will calculate statistics and timeseries groups on-the-fly from the `PracticeAttempt` database collection.

### the agent's Discretion
- Styling of the dashboard widgets (adhering to Mockly styling patterns).
- Layout spacing, card placement, and fallback UI states (e.g., when the user has zero attempts).
- MongoDB aggregation pipeline optimizations.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 3 success criteria and plans
- `.planning/REQUIREMENTS.md` — Requirements DASH-01, DASH-02, DASH-03, REC-01

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/src/models/PracticeAttempt.js` — Stores previous user attempts with individual scores, topic categories, and metadata.
- `server/src/models/Question.js` — Stores questions categorized by topics to pull suggestions from.

### Established Patterns
- Client routing using React Router in `App.jsx`.
- Styling using Vanilla CSS with modern aesthetics.
- Express API routers in `server/src/routes`.

### Integration Points
- Add a Dashboard link/view on the client navbar.
- Create `/api/dashboard/stats` and `/api/dashboard/recommendations` endpoints on the server.

</code_context>

<specifics>
## Specific Ideas

- Show clean fallback graphics/messages if a user has zero attempts, prompting them to start their first practice session.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-progress-dashboard*
*Context gathered: 2026-07-09*
