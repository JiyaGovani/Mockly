import { Router } from 'express';
import protect from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';
import {
  getStats,
  getUsers,
  getQuestions,
  createQuestion,
  bulkCreateQuestions,
  updateQuestion,
  deleteQuestion,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/adminController.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// ── Stats ──────────────────────────────────────────
router.get('/stats', getStats);

// ── Users ──────────────────────────────────────────
router.get('/users', getUsers);

// ── Questions ──────────────────────────────────────
router.get('/questions', getQuestions);
router.post('/questions/bulk', bulkCreateQuestions); // bulk BEFORE :id routes
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// ── Roles ──────────────────────────────────────────
router.get('/roles', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

export default router;
