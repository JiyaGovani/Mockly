---
phase: 2
slug: core-ai-evaluation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js Test Script |
| **Config file** | none |
| **Quick run command** | `node server/src/scripts/test-eval.js` |
| **Full suite command** | `node server/src/scripts/test-eval.js` |
| **Estimated runtime** | ~10 seconds (local Ollama inference latency) |

---

## Sampling Rate

- **After every task commit:** Run `node server/src/scripts/test-eval.js`
- **After every plan wave:** Run `node server/src/scripts/test-eval.js`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | EVAL-01 | — | N/A | integration | `node server/src/scripts/test-eval.js` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | EVAL-02 | — | N/A | integration | `node server/src/scripts/test-eval.js` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | EVAL-03 | — | N/A | integration | `node server/src/scripts/test-eval.js` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | EVAL-04 | — | N/A | integration | `node server/src/scripts/test-eval.js` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 3 | EVAL-05 | — | N/A | manual | browser check | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/src/scripts/test-eval.js` — test suite for matching, embedding, and LLM evaluation

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Practice Question Page UX | EVAL-05 | Visual check | Open client browser at http://localhost:3000/questions, click a question and enter answer to verify loading card, processing steps, and scorecard display. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
