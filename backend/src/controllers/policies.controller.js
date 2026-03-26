import PolicyModel from '../models/policy.model.js';
import { createError } from '../middleware/error-handler.js';
import { parsePagination, paginationMeta } from '../middleware/pagination.js';

/**
 * GET /api/v1/policies
 * List policies with pagination and optional filters.
 */
export async function listPolicies(req, res, next) {
  try {
    const pagination = parsePagination(req.query);
    const filters = {};

    if (req.query.status) filters.status = req.query.status;
    if (req.query.policy_type) filters.policy_type = req.query.policy_type;

    const { rows, total } = await PolicyModel.findAll(filters, pagination);

    res.json({
      data: rows,
      pagination: paginationMeta(total, pagination.page, pagination.limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/policies/:id
 * Get a single policy by ID.
 */
export async function getPolicy(req, res, next) {
  try {
    const policy = await PolicyModel.findById(req.params.id);

    if (!policy) {
      throw createError(404, 'Policy not found', 'POLICY_NOT_FOUND');
    }

    res.json(policy);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/policies
 * Create a new policy. Title and policy_type are required.
 */
export async function createPolicy(req, res, next) {
  try {
    const { title, policy_type, content, author } = req.body;

    if (!title || !policy_type) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'title and policy_type are required',
        },
      });
    }

    const policy = await PolicyModel.create({
      title,
      policy_type,
      content: content || null,
      author: author || `${req.user.last_name}, ${req.user.first_initial}.`,
      status: 'Draft',
      version: '0.1',
    });

    res.status(201).json(policy);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/policies/:id
 * Update a policy. Bumps version if content changes.
 */
export async function updatePolicy(req, res, next) {
  try {
    const existing = await PolicyModel.findById(req.params.id);

    if (!existing) {
      throw createError(404, 'Policy not found', 'POLICY_NOT_FOUND');
    }

    const { title, policy_type, content, author, status } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = title;
    if (policy_type !== undefined) updates.policy_type = policy_type;
    if (author !== undefined) updates.author = author;
    if (status !== undefined) updates.status = status;

    // Bump version if content changed
    if (content !== undefined && content !== existing.content) {
      updates.content = content;
      const currentVersion = parseFloat(existing.version) || 0;
      updates.version = (currentVersion + 0.1).toFixed(1);
    }

    if (Object.keys(updates).length === 0) {
      return res.json(existing);
    }

    const updated = await PolicyModel.update(req.params.id, updates);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/policies/:id
 * Soft-delete a policy.
 */
export async function deletePolicy(req, res, next) {
  try {
    const existing = await PolicyModel.findById(req.params.id);

    if (!existing) {
      throw createError(404, 'Policy not found', 'POLICY_NOT_FOUND');
    }

    await PolicyModel.softDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export default { listPolicies, getPolicy, createPolicy, updatePolicy, deletePolicy };
