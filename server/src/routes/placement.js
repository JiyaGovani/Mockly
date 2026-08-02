import { Router } from 'express';
import protect from '../middleware/auth.js';
import {
  getStatus,
  startAptitude,
  submitAptitude,
  startTechnical,
  submitTechnical,
  startHr,
  submitHr,
  startUnlockSession,
  submitUnlockSession,
  resetPlacementAttempt,
} from '../controllers/placementController.js';

const router = Router();

// All placement routes require authentication
router.use(protect);

/**
 * GET /api/placement/status?role=SDE
 * Returns the current user's placement attempt status for a role.
 */
router.get('/status', getStatus);

/**
 * POST /api/placement/aptitude/start
 * Start (or resume) the Aptitude MCQ round.
 * Body: { role }
 */
router.post('/aptitude/start', startAptitude);

/**
 * POST /api/placement/aptitude/submit
 * Submit Aptitude MCQ answers.
 * Body: { role, answers: [{ questionId, selectedOption }] }
 */
router.post('/aptitude/submit', submitAptitude);

/**
 * POST /api/placement/technical/start
 * Start the Technical subjective round (requires Aptitude passed).
 * Body: { role }
 */
router.post('/technical/start', startTechnical);

/**
 * POST /api/placement/technical/submit
 * Submit Technical round answers for AI evaluation.
 * Body: { role }
 */
router.post('/technical/submit', submitTechnical);

/**
 * POST /api/placement/hr/start
 * Start the HR/Behavioral round (requires Technical passed).
 * Body: { role }
 */
router.post('/hr/start', startHr);

/**
 * POST /api/placement/hr/submit
 * Submit HR round answers for LLM-heavy evaluation.
 * Body: { role }
 */
router.post('/hr/submit', submitHr);

/**
 * POST /api/placement/unlock/start
 * Start a dedicated Unlock Mock Interview for a locked round.
 * Body: { role, roundKey }
 */
router.post('/unlock/start', startUnlockSession);

/**
 * POST /api/placement/unlock/submit
 * Submit the Unlock Mock Interview answers.
 * For aptitude: Body: { role, roundKey, answers: [{ questionId, selectedOption }] }
 * For technical/hr: Body: { role, roundKey, sessionId }
 */
router.post('/unlock/submit', submitUnlockSession);

/**
 * POST /api/placement/reset
 * Reset completed or in-progress placement attempt for a role.
 * Body: { role }
 */
router.post('/reset', resetPlacementAttempt);

export default router;


