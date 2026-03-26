import db from '../config/database.js';

const TABLE = 'qa_reviews';

/**
 * Find all QA reviews with optional filters and pagination.
 * Joins cases for case details.
 */
export async function findAll(filters = {}, { limit, offset } = {}) {
  const query = db(TABLE)
    .select(
      `${TABLE}.*`,
      'cases.case_number',
      'cases.subject_last',
      'cases.case_type',
      'cases.status as case_status',
    )
    .leftJoin('cases', `${TABLE}.case_id`, 'cases.id')
    .whereNull('cases.deleted_at')
    .orderBy(`${TABLE}.created_at`, 'desc');

  if (filters.status) {
    query.where(`${TABLE}.status`, filters.status);
  }

  const countQuery = query.clone().clearSelect().clearOrder().count('* as total').first();
  const [{ total }] = await Promise.all([countQuery]);

  const rows = await query.limit(limit).offset(offset);

  return { rows, total: parseInt(total, 10) };
}

/**
 * Find a single QA review by ID with case details.
 */
export async function findById(id) {
  return db(TABLE)
    .select(
      `${TABLE}.*`,
      'cases.case_number',
      'cases.subject_last',
      'cases.case_type',
      'cases.status as case_status',
      'cases.assigned_to',
    )
    .leftJoin('cases', `${TABLE}.case_id`, 'cases.id')
    .where(`${TABLE}.id`, id)
    .whereNull('cases.deleted_at')
    .first();
}

/**
 * Update a QA review row.
 */
export async function update(id, data) {
  const updates = { ...data, updated_at: new Date() };
  await db(TABLE).where({ id }).update(updates);
  return findById(id);
}

export default { findAll, findById, update };
