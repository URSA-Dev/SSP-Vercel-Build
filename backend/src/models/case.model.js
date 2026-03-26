import db from '../config/database.js';

const TABLE = 'cases';

/**
 * List cases with filtering and pagination.
 * Returns { rows, total } for paginated responses.
 */
export async function findAll(filters = {}, pagination = {}) {
  const { limit = 25, offset = 0 } = pagination;

  let query = db(TABLE)
    .whereNull(`${TABLE}.deleted_at`);

  // Apply filters
  if (filters.status) {
    query = query.where(`${TABLE}.status`, filters.status);
  }
  if (filters.priority) {
    query = query.where(`${TABLE}.priority`, filters.priority);
  }
  if (filters.assigned_to) {
    query = query.where(`${TABLE}.assigned_to`, filters.assigned_to);
  }
  if (filters.case_type) {
    query = query.where(`${TABLE}.case_type`, filters.case_type);
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.where(function () {
      this.whereILike(`${TABLE}.case_number`, term)
        .orWhereILike(`${TABLE}.subject_last`, term);
    });
  }

  // Count total before applying pagination
  const countQuery = query.clone().count('* as count').first();
  const { count: total } = await countQuery;

  // Fetch paginated rows
  const rows = await query
    .select(`${TABLE}.*`)
    .orderBy(`${TABLE}.created_at`, 'desc')
    .limit(limit)
    .offset(offset);

  return { rows, total: parseInt(total, 10) };
}

/**
 * Retrieve a single case by ID with all sub-resources joined.
 */
export async function findById(id) {
  const caseRow = await db(TABLE)
    .where({ id })
    .whereNull('deleted_at')
    .first();

  if (!caseRow) return null;

  const [issues, documents, communications, memos, history] = await Promise.all([
    db('case_issues').where({ case_id: id }).whereNull('deleted_at').orderBy('created_at'),
    db('case_documents').where({ case_id: id }).whereNull('deleted_at').orderBy('created_at', 'desc'),
    db('case_communications').where({ case_id: id }).orderBy('created_at', 'desc'),
    db('case_memos').where({ case_id: id }).orderBy('version', 'desc').first(),
    db('case_history').where({ case_id: id }).orderBy('created_at', 'desc').limit(50),
  ]);

  return {
    ...caseRow,
    issues,
    documents,
    communications,
    memo: memos || null,
    history,
  };
}

/**
 * Insert a new case and return it.
 */
export async function create(data) {
  const [row] = await db(TABLE).insert(data).returning('*');
  return row;
}

/**
 * Update case fields and return the updated row.
 */
export async function update(id, data) {
  data.updated_at = new Date();
  const [row] = await db(TABLE).where({ id }).update(data).returning('*');
  return row;
}

/**
 * Soft-delete a case.
 */
export async function softDelete(id) {
  await db(TABLE).where({ id }).update({ deleted_at: new Date(), updated_at: new Date() });
}

/**
 * Generate the next case number in DOW-YYYY-XXXXX format.
 */
export async function getNextCaseNumber() {
  const year = new Date().getFullYear();
  const prefix = `DOW-${year}-`;

  const latest = await db(TABLE)
    .where('case_number', 'like', `${prefix}%`)
    .orderBy('case_number', 'desc')
    .first();

  let sequence = 1;
  if (latest) {
    const parts = latest.case_number.split('-');
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(5, '0')}`;
}

export default { findAll, findById, create, update, softDelete, getNextCaseNumber };
