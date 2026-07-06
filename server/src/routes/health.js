import { Router } from 'express';

const router = Router();

// Simple health check
router.get('/', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
