import { Router } from 'express';
import { getRoles } from '../controllers/roleController.js';
import protect from '../middleware/auth.js';

const router = Router();

router.get('/', protect, getRoles);

export default router;
