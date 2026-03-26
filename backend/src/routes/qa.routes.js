import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import { paginate } from '../middleware/pagination.js';
import { validate } from '../middleware/validate.js';
import { listQueue, getReview, submitReview } from '../controllers/qa.controller.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/qa — list QA queue (paginated, filter by status)
router.get('/', paginate, listQueue);

// GET /api/v1/qa/:id — get single review
router.get('/:id', validate({ params: { id: 'required|uuid' } }), getReview);

// POST /api/v1/qa/:id/review — submit QA review decision
router.post(
  '/:id/review',
  validate({ params: { id: 'required|uuid' } }),
  auditLog('qa_review'),
  submitReview,
);

export default router;
