import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import { paginate } from '../middleware/pagination.js';
import { requireRole } from '../middleware/require-role.js';
import {
  listRecords,
  getStats,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
} from '../controllers/fcl.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', paginate, listRecords);
router.get('/stats', getStats);
router.get('/:id', getRecord);
router.post('/', auditLog('fcl'), createRecord);
router.put('/:id', auditLog('fcl'), updateRecord);
router.delete('/:id', requireRole('SUPERVISOR', 'ADMIN'), auditLog('fcl'), deleteRecord);

export default router;
