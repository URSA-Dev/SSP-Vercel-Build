import ViolationModel from '../models/violation.model.js';
import { createError } from '../middleware/error-handler.js';
import { parsePagination, paginationMeta } from '../middleware/pagination.js';

/**
 * GET /api/v1/violations
 * List violations with pagination and filtering.
 */
export async function listViolations(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const filters = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.category) filters.category = req.query.category;
    if (req.query.severity) filters.severity = req.query.severity;
    if (req.query.search) filters.search = req.query.search;

    const { rows, total } = await ViolationModel.findAll(filters, { limit, offset });

    res.json({
      data: rows,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/violations/stats
 * Aggregate violation statistics.
 */
export async function getStats(req, res, next) {
  try {
    const stats = await ViolationModel.getStats();
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/violations/:id
 * Get a single violation by ID.
 */
export async function getViolation(req, res, next) {
  try {
    const record = await ViolationModel.findById(req.params.id);

    if (!record) {
      throw createError(404, 'Violation not found', 'VIOLATION_NOT_FOUND');
    }

    res.json({ data: record });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/violations
 * Report a new security violation.
 */
export async function createViolation(req, res, next) {
  try {
    const { category, subject_name, severity, description } = req.body;
    const missing = [];

    if (!category) missing.push({ field: 'category', message: 'category is required' });
    if (!subject_name) missing.push({ field: 'subject_name', message: 'subject_name is required' });
    if (!severity) missing.push({ field: 'severity', message: 'severity is required' });
    if (!description) missing.push({ field: 'description', message: 'description is required' });

    if (missing.length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: missing,
        },
      });
    }

    const violation_number = await ViolationModel.getNextViolationNumber();

    const allowed = ['violation_date', 'category', 'subcategory', 'subject_name',
      'clearance', 'location', 'severity', 'status', 'sso_notified', 'sso_date',
      'adj_impact', 'description', 'actions_taken', 'reported_by', 'closed_date',
      'ci_referral', 'ci_note'];
    const fields = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k)),
    );

    const record = await ViolationModel.create({
      ...fields,
      violation_number,
    });

    res.status(201).json({ data: record });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/violations/:id
 * Update a violation (investigation, status change, CI referral).
 */
export async function updateViolation(req, res, next) {
  try {
    const existing = await ViolationModel.findById(req.params.id);

    if (!existing) {
      throw createError(404, 'Violation not found', 'VIOLATION_NOT_FOUND');
    }

    const allowed = ['violation_date', 'category', 'subcategory', 'subject_name',
      'clearance', 'location', 'severity', 'status', 'sso_notified', 'sso_date',
      'adj_impact', 'description', 'actions_taken', 'reported_by', 'closed_date',
      'ci_referral', 'ci_note'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k)),
    );

    // Auto-set closed_date when status transitions to CLOSED
    if (updates.status === 'CLOSED' && existing.status !== 'CLOSED') {
      updates.closed_date = new Date();
    }

    const record = await ViolationModel.update(req.params.id, updates);

    res.json({ data: record });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/violations/:id
 * Soft-delete a violation.
 */
export async function deleteViolation(req, res, next) {
  try {
    const existing = await ViolationModel.findById(req.params.id);

    if (!existing) {
      throw createError(404, 'Violation not found', 'VIOLATION_NOT_FOUND');
    }

    await ViolationModel.softDelete(req.params.id);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export default { listViolations, getStats, getViolation, createViolation, updateViolation, deleteViolation };
