import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /me (requires auth)
router.get('/', authMiddleware, (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({
    userId: req.user.userId,
    email: req.user.email,
  });
});

export default router;

