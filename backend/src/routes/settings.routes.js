import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import { getSettings, getSetting, setSetting } from '../controllers/settings.controller.js';

const router = Router();

router.use(authenticate);

// GET /api/v1/settings — get all settings (tenant + user)
router.get('/', getSettings);

// GET /api/v1/settings/:key — get single setting
router.get('/:key', getSetting);

// PUT /api/v1/settings/:key — set/update setting
router.put('/:key', auditLog('setting'), setSetting);

export default router;
