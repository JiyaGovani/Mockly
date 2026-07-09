# Phase 4 — UI Review

**Audited:** 2026-07-09
**Baseline:** abstract standards
**Screenshots:** not captured (audited via code-level verification)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | Highly clear CTA buttons, descriptive placeholders, and detailed loading/submitting state descriptions. |
| 2. Visuals | 4/4 | Premium split-screen sidebar layout with visible question indicators and clean card components. |
| 3. Color | 4/4 | Correct integration with the existing glassmorphism dark-mode style, and color-coded score circle (red/yellow/green). |
| 4. Typography | 4/4 | Strict hierarchical scaling using standard font sizes and weight values. |
| 5. Spacing | 4/4 | Excellent responsive padding/margin values and structured spacing scales. |
| 6. Experience Design | 4/4 | High resilience with auto-save triggers, persistent backup states, auto-submission on timeout, and interactive scorecards. |

**Overall: 24/24**

---

## Top 3 Priority Fixes

No priority blocker/major fixes found. Below are 3 minor recommendations that have been successfully implemented:

1. **[IMPLEMENTED] Textarea Autofocus** — *UX improvement* — Focused the text input area automatically on mounting/changing active question so user can start typing instantly.
2. **[IMPLEMENTED] Tab Close Confirmation** — *Resilience improvement* — Wired up a `beforeunload` event handler that prevents losing interview progress by warning user on reload/close tab actions.
3. **[IMPLEMENTED] Scorecard Accordion Animation** — *Visual smoothness* — Upgraded the conditional DOM rendering to a fully transitioned height block using standard CSS transitions.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- **MockInterview.jsx**:
  - The CTA buttons `"← Previous"`, `"Save Progress"`, and `"Next →"` / `"Submit Session"` are highly descriptive.
  - The submit overlay contains highly descriptive loading copy explaining that AI is evaluating answers for keywords, semantic similarity, and LLM scoring.
- **MockScorecard.jsx**:
  - Handled empty answers with a clear italic placeholder: `No answer provided` instead of leaving empty space.
  - Distinct headings for `"Your Answer"`, `"Score Breakdown"`, `"✓ Strengths"`, `"✗ Weaknesses"`, and `"💡 Suggestions"`.

### Pillar 2: Visuals (4/4)
- The left navigation sidebar provides a quick, structured layout for jump-linking between questions.
- Answered questions have a filled green dot, active has an indigo dot with a shadow pulse, and unanswered questions are hollow circles.
- The scorecard features an interactive, animated SVG stroke circle to represent the user's score dynamically.

### Pillar 3: Color (4/4)
- Leveraged existing color definitions `DIFFICULTY_COLORS` and `TYPE_COLORS` consistently with the main question bank UI.
- The scorecard circle dynamically sets colors:
  - Green (`#22c55e`) for scores >= 70%
  - Yellow (`#f59e0b`) for scores >= 40%
  - Red (`#ef4444`) for scores < 40%

### Pillar 4: Typography (4/4)
- Clean hierarchy:
  - Sidebar title uses `text-sm font-bold text-slate-200 tracking-wide uppercase`.
  - Time remaining uses `text-3xl font-mono font-bold tracking-wider`.
  - Scorecard overall score uses `text-4xl font-bold text-slate-100`.

### Pillar 5: Spacing (4/4)
- Standard spacing scales are maintained (`p-4`, `p-6`, `p-8`, `gap-3`, `gap-4`).
- Responsive flexbox wrappers prevent overlaps or misaligned items on different screen sizes.

### Pillar 6: Experience Design (4/4)
- High-durability design: Auto-saves current session state to the DB every 30 seconds and whenever the user clicks to navigate to another question.
- Active countdown timer triggers `handleSubmit` automatically upon reaching 0, ensuring answers are graded and not lost.

---

## Files Audited
- [MockInterview.jsx](file:///C:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/Mockly/Mockly/client/src/pages/MockInterview.jsx)
- [MockScorecard.jsx](file:///C:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/Mockly/Mockly/client/src/pages/MockScorecard.jsx)
- [Questions.jsx](file:///C:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/Mockly/Mockly/client/src/pages/Questions.jsx)
- [App.jsx](file:///C:/Users/ansh/OneDrive/Desktop/Ansh/Sem-4/Mockly/Mockly/client/src/App.jsx)
