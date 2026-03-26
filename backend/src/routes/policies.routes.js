import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import { paginate } from '../middleware/pagination.js';
import { validate } from '../middleware/validate.js';
import {
  listPolicies,
  getPolicy,
  createPolicy,
  updatePolicy,
  deletePolicy,
} from '../controllers/policies.controller.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/policies — list policies (paginated, filter by status, type)
router.get('/', paginate, listPolicies);

// GET /api/v1/policies/:id — get single policy
router.get('/:id', validate({ params: { id: 'required|uuid' } }), getPolicy);

// POST /api/v1/policies — create policy
router.post('/', auditLog('policy'), createPolicy);

// PUT /api/v1/policies/:id — update policy
router.put(
  '/:id',
  validate({ params: { id: 'required|uuid' } }),
  auditLog('policy'),
  updatePolicy,
);

// DELETE /api/v1/policies/:id — soft delete
router.delete(
  '/:id',
  validate({ params: { id: 'required|uuid' } }),
  auditLog('policy'),
  deletePolicy,
);

export default router;
