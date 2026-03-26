import TravelModel from '../models/travel.model.js';
import { createError } from '../middleware/error-handler.js';
import { parsePagination, paginationMeta } from '../middleware/pagination.js';

/**
 * GET /api/v1/travel
 * List foreign travel records with pagination and filtering.
 */
export async function listRecords(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query);
    const filters = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.risk_level) filters.risk_level = req.query.risk_level;
    if (req.query.search) filters.search = req.query.search;

    const { rows, total } = await TravelModel.findAll(filters, { limit, offset });

    res.json({
      data: rows,
      pagination: paginationMeta(total, page, limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/travel/stats
 * Aggregate foreign travel statistics.
 */
export async function getStats(req, res, next) {
  try {
    const stats = await TravelModel.getStats();
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/travel/:id
 * Get a single travel record by ID.
 */
export async function getRecord(req, res, next) {
  try {
    const record = await TravelModel.findById(req.params.id);

    if (!record) {
      throw createError(404, 'Travel record not found', 'TRAVEL_NOT_FOUND');
    }

    res.json({ data: record });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/travel
 * Log a new foreign travel notification.
 */
export async function createRecord(req, res, next) {
  try {
    const { subject_name, countries } = req.body;

    if (!subject_name || !countries) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            ...(!subject_name ? [{ field: 'subject_name', message: 'subject_name is required' }] : []),
            ...(!countries ? [{ field: 'countries', message: 'countries is required' }] : []),
          ],
        },
      });
    }

    const travel_id = await TravelModel.getNextTravelId();

    const record = await TravelModel.create({
      ...req.body,
      travel_id,
    });

    res.status(201).json({ data: record });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/travel/:id
 * Update a travel record (debrief, status change, referral).
 */
export async function updateRecord(req, res, next) {
  try {
    const existing = await TravelModel.findById(req.params.id);

    if (!existing) {
      throw createError(404, 'Travel record not found', 'TRAVEL_NOT_FOUND');
    }

    const record = await TravelModel.update(req.params.id, req.body);

    res.json({ data: record });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/travel/:id
 * Soft-delete a travel record.
 */
export async function deleteRecord(req, res, next) {
  try {
    const existing = await TravelModel.findById(req.params.id);

    if (!existing) {
      throw createError(404, 'Travel record not found', 'TRAVEL_NOT_FOUND');
    }

    await TravelModel.softDelete(req.params.id);

    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export default { listRecords, getStats, getRecord, createRecord, updateRecord, deleteRecord };
