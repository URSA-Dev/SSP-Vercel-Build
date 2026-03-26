import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import { validate } from '../middleware/validate.js';
import { login, logout, getMe, updateMe } from '../controllers/auth.controller.js';

const router = Router();

// POST /login — no auth required
router.post(
  '/login',
  validate({ body: { email: 'required|email', password: 'required|string' } }),
  auditLog('auth'),
  login,
);

// POST /logout — authenticated
router.post('/logout', authenticate, auditLog('auth'), logout);

// GET /me — authenticated
router.get('/me', authenticate, getMe);

// PUT /me — authenticated
router.put(
  '/me',
  authenticate,
  validate({ body: { last_name: 'string', first_initial: 'string|maxLength:1' } }),
  auditLog('user'),
  updateMe,
);

export default router;
