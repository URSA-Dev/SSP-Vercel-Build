import FclModel from '../models/fcl.model.js';
import { createError } from '../middleware/error-handler.js';
import { parsePagination, paginationMeta } from '../middleware/pagination.js';

/**
 * GET /api/v1/fcl
 * List FCL records with pagination and filtering.
 */
export async function listRecords(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const filters = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.clearance_level) filters.clearance_level = req.query.clearance_level;
    if (req.query.search) filters.search = req.query.search;

    const { rows, total } = await FclModel.findAll(filters, { limit, offset });

    res.json({
      data: rows,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/fcl/stats
 * Aggregate FCL statistics.
 */
export async function getStats(req, res, next) {
  try {
    const stats = await FclModel.getStats();
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/fcl/:id
 * Get a single FCL record by ID.
 */
export async function getRecord(req, res, next) {
  try {
    const record = await FclModel.findById(req.params.id);

    if (!record) {
      throw createError(404, 'FCL record not found', 'FCL_NOT_FOUND');
    }

    res.json({ data: record });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/fcl
 * Create a new FCL record.
 */
export async function createRecord(req, res, next) {
  try {
    const { entity_name, clearance_level } = req.body;

    if (!entity_name || !clearance_level) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            ...(!entity_name ? [{ field: 'entity_name', message: 'entity_name is required' }] : []),
            ...(!clearance_level ? [{ field: 'clearance_level', message: 'clearance_level is required' }] : []),
          ],
        },
      });
    }

    const fcl_id = await FclModel.getNextFclId();

    const record = await FclModel.create({
      ...req.body,
      fcl_id,
    });

    res.status(201).json({ data: record });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/fcl/:id
 * Update an FCL record.
 */
export async function updateRecord(req, res, next) {
  try {
    const existing = await FclModel.findById(req.params.id);

    if (!existing) {
      throw createError(404, 'FCL record not found', 'FCL_NOT_FOUND');
    }

    const record = await FclModel.update(req.params.id, req.body);

    res.json({ data: record });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/fcl/:id
 * Soft-delete an FCL record.
 */
export async function deleteRecord(req, res, next) {
  try {
    const existing = await FclModel.findById(req.params.id);

    if (!existing) {
      throw createError(404, 'FCL record not found', 'FCL_NOT_FOUND');
    }

    await FclModel.softDelete(req.params.id);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export default { listRecords, getStats, getRecord, createRecord, updateRecord, deleteRecord };
