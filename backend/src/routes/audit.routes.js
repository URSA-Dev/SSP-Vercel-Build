import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { paginate } from '../middleware/pagination.js';
import { listAuditLog, exportCsv } from '../controllers/audit.controller.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/audit/export — export as CSV (must be before /:id patterns)
router.get('/export', exportCsv);

// GET /api/v1/audit — list audit entries (paginated, filterable)
router.get('/', paginate, listAuditLog);

export default router;
