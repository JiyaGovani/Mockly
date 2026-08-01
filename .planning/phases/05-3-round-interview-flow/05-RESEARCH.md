# Phase 5 Research: 3-Round Placement Interview Flow

## Architecture & Existing Services Integration

1. **Existing Models & Schemas**:
   - `User` model (`server/src/models/User.js`)
   - `Question` model (`server/src/models/Question.js`) supporting types (`mcq`, `subjective`) and difficulties (`easy`, `medium`, `hard`).
   - `InterviewSession` model (`server/src/models/InterviewSession.js`) for mock interview session handling.

2. **Backend Extensions Required**:
   - New `ThreeRoundAttempt` model (`server/src/models/ThreeRoundAttempt.js`) tracking user round progression, scores, attempt counts (max 3), round unlock statuses, and overall status.
   - New endpoints in `server/src/routes/placementRoutes.js` and `server/src/controllers/placementController.js`:
     - `GET /api/placement/status`: Fetch user's active/past placement attempts and unlocked rounds.
     - `POST /api/placement/aptitude/start`: Start Aptitude MCQ round.
     - `POST /api/placement/aptitude/submit`: Grade MCQ answers immediately with rule-based scoring (pass mark: >= 70%).
     - `POST /api/placement/technical/start`: Create technical round session (3 easy, 4 medium, 3 hard).
     - `POST /api/placement/technical/submit`: Submit technical round, evaluate via hybrid scoring pipeline.
     - `POST /api/placement/hr/start`: Create HR round session.
     - `POST /api/placement/hr/submit`: Submit HR round, evaluate via LLM-heavy scoring.

3. **Frontend Views Required**:
   - Placement Dashboard / Hub (`client/src/pages/PlacementHub.jsx`) showing round progress cards (Aptitude, Technical, HR), locked/unlocked state indicators, remaining attempts counter (X/3 left), and "Start Round" triggers.
   - Aptitude Test Workspace (`client/src/pages/AptitudeTestWorkspace.jsx`) with MCQ selection UI and timer.
   - Placement Result Modal / Summary Card.
