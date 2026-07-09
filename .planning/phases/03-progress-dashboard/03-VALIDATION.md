---
phase: 3
slug: progress-dashboard
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-09
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js scripting with Mongoose |
| **Config file** | none |
| **Quick run command** | `node server/src/scripts/test-dashboard.js` |
| **Full suite command** | `node server/src/scripts/test-dashboard.js` |
| **Estimated runtime** | ~1.5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node server/src/scripts/test-dashboard.js`
- **After every plan wave:** Run `node server/src/scripts/test-dashboard.js`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 2 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | DASH-03 | — | N/A | integration | `node server/src/scripts/test-dashboard.js --stats` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | DASH-01, DASH-02 | — | N/A | integration | `node server/src/scripts/test-dashboard.js --charts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | REC-01 | — | N/A | integration | `node server/src/scripts/test-dashboard.js --recommendations` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/src/scripts/test-dashboard.js` — test data insertion and API stub triggers

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Render interactive Recharts line/radar charts | DASH-01, DASH-02 | Client side rendering and UI layout validation | Log in, complete a few practices, navigate to the Dashboard tab, and verify that the line chart displays scores sequentially, and the radar chart maps average scores. |
| Time range filter dropdown changes data | DASH-01, DASH-02 | UI visual interactive state | Select "Last 7 Days" or "Last 30 Days" and check that the charts and stats cards reload and display the filtered results. |
| Question Recommendations cards list unattempted items | REC-01 | Client navigation | Click a recommended question card from the dashboard and verify it opens the practice workspace. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
