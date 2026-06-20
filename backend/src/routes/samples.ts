import { Router } from 'express';
import { getSamples, createSample, calculateActivity } from '../controllers/samples';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken as any, getSamples as any);
router.post('/', authenticateToken as any, createSample as any);
router.put('/:sampleId/calculate', authenticateToken as any, calculateActivity as any);

export default router;
