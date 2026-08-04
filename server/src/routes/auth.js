import { Router } from 'express';
import { register, login, getMe, resetPassword } from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);

// Protected route — requires valid JWT
router.get('/me', protect, getMe);

export default router;
