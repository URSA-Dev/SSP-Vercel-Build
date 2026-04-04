import db from '../config/database.js';

const TABLE = 'subjects';

/**
 * List subjects with filtering and pagination.
 */
export async function findAll(filters = {}, pagination = {}) {
  const { limit = 25, offset = 0 } = pagination;

  let query = db(TABLE).whereNull('deleted_at');

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.where(function () {
      this.whereILike('subject_last', term)
        .orWhereILike('case_id', term);
    });
  }

  const countQuery = query.clone().count('* as count').first();
  const { count: total } = await countQuery;

  const rows = await query
    .select('*')
    .orderBy('subject_last', 'asc')
    .limit(limit)
    .offset(offset);

  return { rows, total: parseInt(total, 10) };
}

/**
 * Find a subject by ID.
 */
export async function findById(id) {
  return db(TABLE)
    .where({ id })
    .whereNull('deleted_at')
    .first();
}

/**
 * Find a subject by case_id (strongest match).
 */
export async function findByCaseId(caseId) {
  if (!caseId) return null;
  return db(TABLE)
    .where({ case_id: caseId })
    .whereNull('deleted_at')
    .first();
}

/**
 * Find a subject by name composite (case-insensitive).
 */
export async function findByName(subjectLast, subjectInit, middleInit = null, dobYear = null) {
  let query = db(TABLE)
    .whereRaw('LOWER(subject_last) = ?', [subjectLast.toLowerCase()])
    .whereRaw('UPPER(subject_init) = ?', [subjectInit.toUpperCase()])
    .whereNull('deleted_at');

  if (middleInit) {
    query = query.whereRaw('UPPER(middle_init) = ?', [middleInit.toUpperCase()]);
  } else {
    query = query.whereNull('middle_init');
  }

  if (dobYear) {
    query = query.where('dob_year', dobYear);
  } else {
    query = query.whereNull('dob_year');
  }

  return query.first();
}

/**
 * Generate the next case ID in CID-XXXXX format.
 */
export async function getNextCaseId() {
  const latest = await db(TABLE)
    .whereNotNull('case_id')
    .orderBy('case_id', 'desc')
    .first();

  let sequence = 1;
  if (latest && latest.case_id) {
    const num = parseInt(latest.case_id.replace('CID-', ''), 10);
    if (!isNaN(num)) sequence = num + 1;
  }

  return `CID-${String(sequence).padStart(5, '0')}`;
}

/**
 * Atomic find-or-create. Checks name composite.
 * Auto-generates case_id for new subjects.
 * Returns the existing or newly created subject.
 */
export async function findOrCreate(data) {
  const { subject_last, subject_init, middle_init, dob_year } = data;

  // Match by name composite
  const byName = await findByName(subject_last, subject_init, middle_init, dob_year);
  if (byName) return byName;

  // No match — create new subject with auto-generated case_id
  const caseId = await getNextCaseId();

  const insertData = {
    subject_last,
    subject_init: subject_init.toUpperCase(),
    case_id: caseId,
  };
  if (middle_init) insertData.middle_init = middle_init.toUpperCase();
  if (dob_year) insertData.dob_year = dob_year;

  const [created] = await db(TABLE).insert(insertData).returning('*');
  return created;
}

/**
 * Count active cases linked to a subject.
 */
export async function getCaseCount(subjectId) {
  const result = await db('cases')
    .where({ subject_id: subjectId })
    .whereNull('deleted_at')
    .count('* as count')
    .first();
  return parseInt(result.count, 10);
}

/**
 * Insert a new subject.
 */
export async function create(data) {
  const [row] = await db(TABLE).insert(data).returning('*');
  return row;
}

/**
 * Update subject fields.
 */
export async function update(id, data) {
  data.updated_at = new Date();
  const [row] = await db(TABLE).where({ id }).update(data).returning('*');
  return row;
}

/**
 * Soft-delete a subject.
 */
export async function softDelete(id) {
  await db(TABLE).where({ id }).update({ deleted_at: new Date(), updated_at: new Date() });
}

export default {
  findAll, findById, findByCaseId, findByName,
  findOrCreate, getNextCaseId, getCaseCount, create, update, softDelete,
};
