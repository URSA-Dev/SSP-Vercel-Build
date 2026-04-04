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
        .orWhereILike('employee_id', term);
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
 * Find a subject by employee ID (strongest match).
 */
export async function findByEmployeeId(employeeId) {
  if (!employeeId) return null;
  return db(TABLE)
    .where({ employee_id: employeeId })
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
 * Atomic find-or-create. Checks employee_id first, then name composite.
 * Returns the existing or newly created subject.
 */
export async function findOrCreate(data) {
  const { subject_last, subject_init, middle_init, dob_year, employee_id } = data;

  // Priority 1: match by employee_id
  if (employee_id) {
    const byEmpId = await findByEmployeeId(employee_id);
    if (byEmpId) return byEmpId;
  }

  // Priority 2: match by name composite
  const byName = await findByName(subject_last, subject_init, middle_init, dob_year);
  if (byName) {
    // If we now have an employee_id and the existing record doesn't, update it
    if (employee_id && !byName.employee_id) {
      const [updated] = await db(TABLE)
        .where({ id: byName.id })
        .update({ employee_id, updated_at: new Date() })
        .returning('*');
      return updated;
    }
    return byName;
  }

  // No match — create new subject
  const insertData = {
    subject_last,
    subject_init: subject_init.toUpperCase(),
  };
  if (middle_init) insertData.middle_init = middle_init.toUpperCase();
  if (dob_year) insertData.dob_year = dob_year;
  if (employee_id) insertData.employee_id = employee_id;

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
  findAll, findById, findByEmployeeId, findByName,
  findOrCreate, getCaseCount, create, update, softDelete,
};
