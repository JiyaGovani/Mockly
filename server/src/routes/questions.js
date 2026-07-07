import { Router } from 'express';
import {
  getQuestions,
  getQuestionById,
} from '../controllers/questionController.js';
import protect from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getQuestions);
router.get('/:id', protect, getQuestionById);

export default router;
