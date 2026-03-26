import db from '../config/database.js';

const TABLE = 'case_documents';

/**
 * Find all documents for a given case (active only).
 */
export async function findByCaseId(caseId) {
  return db(TABLE)
    .where({ case_id: caseId })
    .whereNull('deleted_at')
    .orderBy('created_at', 'desc');
}

/**
 * Find a single document by ID.
 */
export async function findById(id) {
  return db(TABLE)
    .where({ id })
    .whereNull('deleted_at')
    .first();
}

/**
 * Insert a new document record.
 */
export async function create(data) {
  const [row] = await db(TABLE).insert(data).returning('*');
  return row;
}

/**
 * Update a document record.
 */
export async function update(id, data) {
  data.updated_at = new Date();
  const [row] = await db(TABLE).where({ id }).update(data).returning('*');
  return row;
}

/**
 * Soft-delete a document.
 */
export async function softDelete(id) {
  await db(TABLE).where({ id }).update({ deleted_at: new Date(), updated_at: new Date() });
}

export default { findByCaseId, findById, create, update, softDelete };
