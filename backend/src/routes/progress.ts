import { Router } from 'express';
import { getProgress, updateProgress } from '../controllers/progress';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken as any, getProgress as any);
router.put('/', authenticateToken as any, updateProgress as any);

export default router;
