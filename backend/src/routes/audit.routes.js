import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { paginate } from '../middleware/pagination.js';
import { requireRole } from '../middleware/require-role.js';
import { listAuditLog, exportCsv } from '../controllers/audit.controller.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/audit/export — export as CSV (supervisor/admin only)
router.get('/export', requireRole('SUPERVISOR', 'ADMIN'), exportCsv);

// GET /api/v1/audit — list audit entries (paginated, filterable)
router.get('/', paginate, listAuditLog);

export default router;
