import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import { paginate } from '../middleware/pagination.js';
import {
  listRecords,
  getStats,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
} from '../controllers/travel.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', paginate, listRecords);
router.get('/stats', getStats);
router.get('/:id', getRecord);
router.post('/', auditLog('travel'), createRecord);
router.put('/:id', auditLog('travel'), updateRecord);
router.delete('/:id', auditLog('travel'), deleteRecord);

export default router;
