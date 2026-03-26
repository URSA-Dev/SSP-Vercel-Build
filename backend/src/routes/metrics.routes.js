import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  dashboardMetrics,
  workloadMetrics,
  suspenseMetrics,
} from '../controllers/metrics.controller.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/metrics/dashboard — dashboard KPIs
router.get('/dashboard', dashboardMetrics);

// GET /api/v1/metrics/workload — workload distribution per analyst
router.get('/workload', workloadMetrics);

// GET /api/v1/metrics/suspense — suspense compliance stats
router.get('/suspense', suspenseMetrics);

export default router;
