# Phase 4 UI Specification — Mock Interview Mode

This document establishes the user interface design contract for the Mock Interview Mode pages.

## 1. Mock Session Workspace Layout

### Page Layout
- **Container**: Responsive full-viewport viewport with sticky header and sidebar.
- **Background**: Modern dark gradient with blurred background orbs (matching global aesthetics).
- **Split Screen**:
  - **Left Panel (Sidebar)**:
    - Fixed width (260px), glassmorphic border on the right.
    - Top Section: "Mock Interview — SDE" title.
    - Mid Section: A vertical checklist of Questions 1-10. Each item displays an indicator dot:
      - **Grey (Border)**: Unattempted/Unvisited.
      - **Indigo (Glow)**: Current active question.
      - **Emerald (Solid)**: Answered & Saved.
    - Bottom Section: Countdown timer box displaying `MM:SS`.
  - **Right Panel (Main Content)**:
    - Flex-1 scrollable area.
    - Card: Large glassmorphism block containing:
      - Header: Question index, category, and difficulty badges.
      - Body: Question text (20px, Slate-100, medium tracking).
      - Input: Textarea (full-width, dark background, placeholder "Type your answer here...").
    - Action Buttons Row:
      - Left: "Previous Question" button.
      - Center: "Save Answer" button (Indigo gradient).
      - Right: "Next Question" or "Submit Session" button.

---

## 2. Timer Component Styles

- **Location**: Anchored at the bottom-left of the workspace panel.
- **Idle State**: Slate-300 font, smooth ticking indicator.
- **Alert State**: If remaining time is under **5 minutes**, the text turns red (`text-red-500`) and pulses softly to notify the user.
- **Action**: When reaching `00:00`, a full-screen loading backdrop appears saying "Time limit reached. Submitting session for AI evaluation..." and triggers the submit endpoint automatically.

---

## 3. Scorecard / Report Page

- **Container**: Max-w-5xl centered page layout.
- **Overall Score Card**:
  - Centered circular progress container, displaying overall average score (e.g. `82%`).
  - Text summary: "SDE Mock Session completed on [Date] in 32 minutes."
- **Per-Question Breakdown Accordion**:
  - Grid list of all 10 questions.
  - Each item card shows:
    - Question text summary and user's score.
    - Toggle button "View Detailed AI Analysis".
    - Expanded Content: Blended scores breakdown (Keywords, Embeddings, LLM) and lists of strengths/weaknesses.
