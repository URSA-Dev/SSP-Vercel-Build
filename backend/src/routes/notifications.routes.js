import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import { paginate } from '../middleware/pagination.js';
import { validate } from '../middleware/validate.js';
import {
  listNotifications,
  markRead,
  markAllRead,
  clearAll,
} from '../controllers/notifications.controller.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/notifications — list notifications for current user
router.get('/', paginate, listNotifications);

// PATCH /api/v1/notifications/read-all — mark all as read (before /:id routes)
router.patch('/read-all', auditLog('notification'), markAllRead);

// PATCH /api/v1/notifications/:id/read — mark single as read
router.patch(
  '/:id/read',
  validate({ params: { id: 'required|uuid' } }),
  auditLog('notification'),
  markRead,
);

// DELETE /api/v1/notifications/clear — delete all notifications
router.delete('/clear', auditLog('notification'), clearAll);

export default router;
