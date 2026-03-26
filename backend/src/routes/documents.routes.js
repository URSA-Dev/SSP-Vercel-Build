import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import { validate } from '../middleware/validate.js';
import {
  upload,
  listDocuments,
  uploadDocument,
  confirmExtraction,
  rejectExtraction,
  deleteDocument,
} from '../controllers/documents.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /case/:caseId — list documents for a case
router.get(
  '/case/:caseId',
  validate({ params: { caseId: 'required|uuid' } }),
  listDocuments,
);

// POST /case/:caseId — upload document
router.post(
  '/case/:caseId',
  validate({ params: { caseId: 'required|uuid' } }),
  upload.single('file'),
  auditLog('document'),
  uploadDocument,
);

// PATCH /:id/confirm — confirm AI extraction
router.patch(
  '/:id/confirm',
  validate({ params: { id: 'required|uuid' } }),
  auditLog('document'),
  confirmExtraction,
);

// PATCH /:id/reject — reject extraction
router.patch(
  '/:id/reject',
  validate({ params: { id: 'required|uuid' } }),
  auditLog('document'),
  rejectExtraction,
);

// DELETE /:id — soft delete
router.delete(
  '/:id',
  validate({ params: { id: 'required|uuid' } }),
  auditLog('document'),
  deleteDocument,
);

export default router;
