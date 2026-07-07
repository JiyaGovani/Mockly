# Phase 2: Core AI Evaluation - Context

**Gathered:** 2026-07-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate local Ollama LLM, embed cosine similarity, and build the hybrid scoring and feedback pipeline.

</domain>

<decisions>
## Implementation Decisions

### Ollama Configuration & Integration
- **D-01:** Local Ollama endpoint defaults to `http://localhost:11434`. The connection timeout for API requests is set to 30 seconds.
- **D-02:** The default model name for LLM evaluation is `llama3`.
- **D-03:** All Ollama integration settings (URL, model name, and timeout) must be configurable via the server `.env` file.

### Embedding Model & Caching
- **D-04:** Use `nomic-embed-text` as the vector embedding model for computing answer similarity.
- **D-05:** Caching Strategy: Pre-compute and store the expected answer's vector embedding directly inside the `Question` database schema during database seeding or first compute. This reduces evaluation runtime latency by requiring only one live embedding API call (for the user's answer).

### Keyword Matching Mechanics
- **D-06:** Keyword matching will utilize stemming and NLP via the `natural` library. Both the user's answer tokens and the target question's `keyPoints` will be stemmed before checking for matches. This correctly supports plural/singular variations and verb stem forms.

### Evaluation UI & Loading States
- **D-07:** The practice screen will feature a polished loading card containing skeleton loaders, current processing status steps, and dynamic mock interview preparation tips to keep the user engaged during the local AI evaluation.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/ROADMAP.md` — Phase 2 Success criteria and goals
- `.planning/REQUIREMENTS.md` — Active evaluation requirements (EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server/src/models/Question.js` — Question schema (needs modification to store `expectedAnswerEmbedding`)
- `client/src/pages/Questions.jsx` — Practice question details modal (needs modification to link to the new practice screen)

### Established Patterns
- Client routing and styling using React Router and Tailwind CSS
- Server uses standard ES Modules (`import` / `export`) with environment variables in `.env`

</code_context>

<specifics>
## Specific Ideas

- **Evaluation feedback format:** The feedback card should present Strengths, Weaknesses, Missing Points, and Suggestions clearly using separate cards or bullet items.

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>
