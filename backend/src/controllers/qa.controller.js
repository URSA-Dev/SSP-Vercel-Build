import QaModel from '../models/qa.model.js';
import db from '../config/database.js';
import { createError } from '../middleware/error-handler.js';
import { parsePagination, paginationMeta } from '../middleware/pagination.js';

/**
 * GET /api/v1/qa
 * List QA queue with pagination and optional status filter.
 */
export async function listQueue(req, res, next) {
  try {
    const pagination = parsePagination(req.query);
    const filters = {};

    if (req.query.status) {
      filters.status = req.query.status;
    }

    const { rows, total } = await QaModel.findAll(filters, pagination);

    res.json({
      data: rows,
      pagination: paginationMeta(total, pagination.page, pagination.limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/qa/:id
 * Get a single QA review with case info.
 */
export async function getReview(req, res, next) {
  try {
    const review = await QaModel.findById(req.params.id);

    if (!review) {
      throw createError(404, 'QA review not found', 'QA_REVIEW_NOT_FOUND');
    }

    res.json(review);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/qa/:id/review
 * Submit a QA review decision.
 * Valid outcomes: Passed, Minor Revisions, Major Revisions, Rejected
 */
export async function submitReview(req, res, next) {
  try {
    const { id } = req.params;
    const { outcome, comments } = req.body;

    const validOutcomes = ['Passed', 'Minor Revisions', 'Major Revisions', 'Rejected'];

    if (!outcome || !validOutcomes.includes(outcome)) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: `outcome is required and must be one of: ${validOutcomes.join(', ')}`,
        },
      });
    }

    const review = await QaModel.findById(id);

    if (!review) {
      throw createError(404, 'QA review not found', 'QA_REVIEW_NOT_FOUND');
    }

    // Determine new case status based on outcome
    const caseStatusMap = {
      'Passed': 'SUBMITTED',
      'Minor Revisions': 'QA_REVISION',
      'Major Revisions': 'QA_REVISION',
      'Rejected': 'QA_REVISION',
    };

    const newCaseStatus = caseStatusMap[outcome];

    // Update QA review
    const updated = await QaModel.update(id, {
      status: 'Completed',
      outcome,
      comments: comments || null,
      reviewer: `${req.user.last_name}, ${req.user.first_initial}.`,
      reviewed_at: new Date(),
    });

    // Update case status based on outcome
    await db('cases')
      .where({ id: review.case_id })
      .update({
        status: newCaseStatus,
        updated_at: new Date(),
      });

    // Add case history entry
    await db('case_history').insert({
      case_id: review.case_id,
      action: `QA Review: ${outcome}`,
      detail: comments || `QA review completed with outcome: ${outcome}`,
      user_name: `${req.user.last_name}, ${req.user.first_initial}.`,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export default { listQueue, getReview, submitReview };
