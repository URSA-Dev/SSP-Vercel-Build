import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import { validate } from '../middleware/validate.js';
import { paginate } from '../middleware/pagination.js';
import { requireRole } from '../middleware/require-role.js';
import {
  createCaseSchema, updateStatusSchema, addIssueSchema,
  addCommSchema, saveMemoSchema, caseByIdSchema,
} from '../schemas/cases.schema.js';
import {
  listCases, getCase, createCase, updateCase, updateStatus, deleteCase,
  addIssue, updateIssue, deleteIssue,
  addCommunication, getHistory, saveMemo, qaCheck, submitQa,
} from '../controllers/cases.controller.js';
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

// ---------- Core case CRUD ----------

// GET / — list cases (paginated, filterable)
router.get('/', paginate, listCases);

// GET /:id — get single case with sub-resources
router.get(
  '/:id',
  validate(caseByIdSchema),
  getCase,
);

// POST / — create new case (Zod validates case_type enum, priority enum)
router.post(
  '/',
  validate(createCaseSchema),
  auditLog('case'),
  createCase,
);

// PUT /:id — update case fields
router.put(
  '/:id',
  validate(caseByIdSchema),
  auditLog('case'),
  updateCase,
);

// PATCH /:id/status — workflow transition (Zod validates status enum)
router.patch(
  '/:id/status',
  validate(updateStatusSchema),
  auditLog('case'),
  updateStatus,
);

// DELETE /:id — soft delete (supervisor/admin only)
router.delete(
  '/:id',
  requireRole('SUPERVISOR', 'ADMIN'),
  validate({ params: { id: 'required|uuid' } }),
  auditLog('case'),
  deleteCase,
);

// ---------- Issues sub-resource ----------

router.post(
  '/:id/issues',
  validate(addIssueSchema),
  auditLog('case_issue'),
  addIssue,
);

router.put(
  '/:id/issues/:issueId',
  validate({ params: { id: 'required|uuid', issueId: 'required|uuid' } }),
  auditLog('case_issue'),
  updateIssue,
);

router.delete(
  '/:id/issues/:issueId',
  validate({ params: { id: 'required|uuid', issueId: 'required|uuid' } }),
  auditLog('case_issue'),
  deleteIssue,
);

// ---------- Communications ----------

router.post(
  '/:id/communications',
  validate(addCommSchema),
  auditLog('case_communication'),
  addCommunication,
);

// ---------- History ----------

router.get(
  '/:id/history',
  validate(caseByIdSchema),
  paginate,
  getHistory,
);

// ---------- Memo ----------

router.put(
  '/:id/memo',
  validate(saveMemoSchema),
  auditLog('case_memo'),
  saveMemo,
);

router.post(
  '/:id/memo/qa-check',
  validate(caseByIdSchema),
  qaCheck,
);

// ---------- Documents (nested under case) ----------

router.get(
  '/:id/documents',
  validate(caseByIdSchema),
  (req, _res, next) => { req.params.caseId = req.params.id; next(); },
  listDocuments,
);

router.post(
  '/:id/documents',
  validate(caseByIdSchema),
  (req, _res, next) => { req.params.caseId = req.params.id; next(); },
  upload.single('file'),
  auditLog('document'),
  uploadDocument,
);

router.post(
  '/:id/documents/:docId/confirm',
  validate({ params: { id: 'required|uuid', docId: 'required|uuid' } }),
  (req, _res, next) => { req.params.id = req.params.docId; next(); },
  auditLog('document'),
  confirmExtraction,
);

router.post(
  '/:id/documents/:docId/reject',
  validate({ params: { id: 'required|uuid', docId: 'required|uuid' } }),
  (req, _res, next) => { req.params.id = req.params.docId; next(); },
  auditLog('document'),
  rejectExtraction,
);

router.delete(
  '/:id/documents/:docId',
  validate({ params: { id: 'required|uuid', docId: 'required|uuid' } }),
  (req, _res, next) => { req.params.id = req.params.docId; next(); },
  auditLog('document'),
  deleteDocument,
);

// ---------- QA submission ----------

router.post(
  '/:id/submit-qa',
  validate(caseByIdSchema),
  auditLog('qa_review'),
  submitQa,
);

export default router;
