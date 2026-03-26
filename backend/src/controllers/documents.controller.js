import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import multer from 'multer';
import config from '../config/index.js';
import db from '../config/database.js';
import DocumentModel from '../models/document.model.js';
import { createError } from '../middleware/error-handler.js';

// ---------- Multer setup ----------

const uploadDir = path.resolve(config.upload.dir);
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  },
});

// ---------- helpers ----------

async function addHistory(caseId, action, detail, user) {
  const userName = user && typeof user === 'object'
    ? `${user.last_name}, ${user.first_initial}.`
    : user || 'System';
  await db('case_history').insert({
    case_id: caseId,
    action,
    detail,
    user_name: userName,
  });
}

/**
 * Simulate AI extraction by setting mock extracted fields after a delay.
 */
function simulateAiExtraction(docId) {
  setTimeout(async () => {
    try {
      const doc = await DocumentModel.findById(docId);
      if (!doc || doc.status !== 'processing') return;

      await DocumentModel.update(docId, {
        status: 'awaiting',
        extracted_fields: JSON.stringify({
          document_type: 'SF-86',
          subject_name: 'Extracted Name',
          date_signed: new Date().toISOString().slice(0, 10),
          classification: 'UNCLASSIFIED',
          confidence: 0.87,
        }),
      });
    } catch (err) {
      console.error('AI extraction simulation error:', err.message);
    }
  }, 3000);
}

// ---------- controllers ----------

/**
 * GET /api/v1/documents/case/:caseId
 */
export async function listDocuments(req, res, next) {
  try {
    const caseRow = await db('cases')
      .where({ id: req.params.caseId })
      .whereNull('deleted_at')
      .first();

    if (!caseRow) {
      throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    const docs = await DocumentModel.findByCaseId(req.params.caseId);
    res.json({ data: docs });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/documents/case/:caseId
 * Upload a document (expects multer single file on field "file").
 */
export async function uploadDocument(req, res, next) {
  try {
    const caseRow = await db('cases')
      .where({ id: req.params.caseId })
      .whereNull('deleted_at')
      .first();

    if (!caseRow) {
      throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
    }

    if (!req.file) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'File is required' },
      });
    }

    const doc = await DocumentModel.create({
      case_id: req.params.caseId,
      filename: req.file.originalname,
      file_path: req.file.path,
      file_size: String(req.file.size),
      doc_type: req.file.mimetype,
      status: 'processing',
    });

    // Kick off simulated AI extraction
    simulateAiExtraction(doc.id);

    await addHistory(
      req.params.caseId,
      'DOCUMENT_UPLOADED',
      `Document uploaded: ${req.file.originalname}`,
      req.user,
    );

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/documents/:id/confirm
 * Confirm AI extraction results.
 */
export async function confirmExtraction(req, res, next) {
  try {
    const doc = await DocumentModel.findById(req.params.id);

    if (!doc) {
      throw createError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
    }

    if (doc.status !== 'awaiting') {
      return res.status(422).json({
        error: {
          code: 'INVALID_STATE',
          message: 'Document must be in awaiting state to confirm',
        },
      });
    }

    const updated = await DocumentModel.update(req.params.id, {
      status: 'confirmed',
    });

    await addHistory(
      doc.case_id,
      'DOCUMENT_CONFIRMED',
      `Document extraction confirmed: ${doc.filename}`,
      req.user,
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/documents/:id/reject
 * Reject extraction results and reset to processing for re-extraction.
 */
export async function rejectExtraction(req, res, next) {
  try {
    const doc = await DocumentModel.findById(req.params.id);

    if (!doc) {
      throw createError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
    }

    if (doc.status !== 'awaiting') {
      return res.status(422).json({
        error: {
          code: 'INVALID_STATE',
          message: 'Document must be in awaiting state to reject',
        },
      });
    }

    const updated = await DocumentModel.update(req.params.id, {
      status: 'processing',
      extracted_fields: null,
    });

    // Re-run extraction simulation
    simulateAiExtraction(updated.id);

    await addHistory(
      doc.case_id,
      'DOCUMENT_REJECTED',
      `Document extraction rejected for re-processing: ${doc.filename}`,
      req.user,
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/documents/:id
 */
export async function deleteDocument(req, res, next) {
  try {
    const doc = await DocumentModel.findById(req.params.id);

    if (!doc) {
      throw createError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
    }

    await DocumentModel.softDelete(req.params.id);

    await addHistory(
      doc.case_id,
      'DOCUMENT_DELETED',
      `Document deleted: ${doc.filename}`,
      req.user,
    );

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export default {
  upload,
  listDocuments,
  uploadDocument,
  confirmExtraction,
  rejectExtraction,
  deleteDocument,
};
