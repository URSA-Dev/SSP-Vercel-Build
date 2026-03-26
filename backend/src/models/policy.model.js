import db from '../config/database.js';

const TABLE = 'policies';

/**
 * Find all policies with optional filters and pagination.
 */
export async function findAll(filters = {}, { limit, offset } = {}) {
  const query = db(TABLE)
    .select('*')
    .whereNull('deleted_at')
    .orderBy('updated_at', 'desc');

  if (filters.status) {
    query.where('status', filters.status);
  }

  if (filters.policy_type) {
    query.where('policy_type', filters.policy_type);
  }

  const countQuery = query.clone().clearSelect().clearOrder().count('* as total').first();
  const [{ total }] = await Promise.all([countQuery]);

  const rows = await query.limit(limit).offset(offset);

  return { rows, total: parseInt(total, 10) };
}

/**
 * Find a single policy by ID.
 */
export async function findById(id) {
  return db(TABLE)
    .where({ id })
    .whereNull('deleted_at')
    .first();
}

/**
 * Create a new policy.
 */
export async function create(data) {
  const [row] = await db(TABLE).insert(data).returning('*');
  return row;
}

/**
 * Update a policy row.
 */
export async function update(id, data) {
  const updates = { ...data, updated_at: new Date() };
  await db(TABLE).where({ id }).update(updates);
  return findById(id);
}

/**
 * Soft-delete a policy.
 */
export async function softDelete(id) {
  await db(TABLE).where({ id }).update({
    deleted_at: new Date(),
    updated_at: new Date(),
  });
}

export default { findAll, findById, create, update, softDelete };
