import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import { paginate } from '../middleware/pagination.js';
import {
  listViolations,
  getStats,
  getViolation,
  createViolation,
  updateViolation,
  deleteViolation,
} from '../controllers/violations.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', paginate, listViolations);
router.get('/stats', getStats);
router.get('/:id', getViolation);
router.post('/', auditLog('violation'), createViolation);
router.put('/:id', auditLog('violation'), updateViolation);
router.delete('/:id', auditLog('violation'), deleteViolation);

export default router;
