import db from '../config/database.js';

const TABLE = 'violations';

/**
 * List violations with filtering and pagination.
 * Returns { rows, total } for paginated responses.
 */
export async function findAll(filters = {}, pagination = {}) {
  const { limit = 25, offset = 0 } = pagination;

  let query = db(TABLE).whereNull(`${TABLE}.deleted_at`);

  if (filters.status) {
    query = query.where(`${TABLE}.status`, filters.status);
  }
  if (filters.category && filters.category !== 'All') {
    query = query.where(`${TABLE}.category`, filters.category);
  }
  if (filters.severity) {
    query = query.where(`${TABLE}.severity`, filters.severity);
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.where(function () {
      this.whereILike(`${TABLE}.subject_name`, term)
        .orWhereILike(`${TABLE}.violation_number`, term)
        .orWhereILike(`${TABLE}.description`, term);
    });
  }

  const countQuery = query.clone().count('* as count').first();
  const { count: total } = await countQuery;

  const rows = await query
    .select(`${TABLE}.*`)
    .orderBy(`${TABLE}.created_at`, 'desc')
    .limit(limit)
    .offset(offset);

  return { rows, total: parseInt(total, 10) };
}

/**
 * Retrieve a single violation by ID.
 */
export async function findById(id) {
  return db(TABLE)
    .where({ id })
    .whereNull('deleted_at')
    .first();
}

/**
 * Insert a new violation and return it.
 */
export async function create(data) {
  const [row] = await db(TABLE).insert(data).returning('*');
  return row;
}

/**
 * Update violation fields and return the updated row.
 */
export async function update(id, data) {
  data.updated_at = new Date();
  const [row] = await db(TABLE).where({ id }).update(data).returning('*');
  return row;
}

/**
 * Soft-delete a violation.
 */
export async function softDelete(id) {
  await db(TABLE).where({ id }).update({
    deleted_at: new Date(),
    updated_at: new Date(),
  });
}

/**
 * Aggregate stats for the violations dashboard.
 */
export async function getStats() {
  const base = db(TABLE).whereNull('deleted_at');

  const [open, seriousCritical, adjImpact, ciReferrals] = await Promise.all([
    base.clone()
      .whereNot({ status: 'CLOSED' })
      .count('* as count')
      .first(),
    base.clone()
      .whereIn('severity', ['SERIOUS', 'CRITICAL'])
      .whereNot({ status: 'CLOSED' })
      .count('* as count')
      .first(),
    base.clone()
      .where({ adj_impact: true })
      .whereNot({ status: 'CLOSED' })
      .count('* as count')
      .first(),
    base.clone()
      .where({ ci_referral: true })
      .count('* as count')
      .first(),
  ]);

  return {
    open: parseInt(open.count, 10),
    seriousCritical: parseInt(seriousCritical.count, 10),
    adjImpact: parseInt(adjImpact.count, 10),
    ciReferrals: parseInt(ciReferrals.count, 10),
  };
}

/**
 * Generate the next SV-YYYY-XXX violation number.
 */
export async function getNextViolationNumber() {
  const year = new Date().getFullYear();
  const prefix = `SV-${year}-`;

  const latest = await db(TABLE)
    .where('violation_number', 'like', `${prefix}%`)
    .orderBy('violation_number', 'desc')
    .first();

  let sequence = 1;
  if (latest) {
    const parts = latest.violation_number.split('-');
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

export default { findAll, findById, create, update, softDelete, getStats, getNextViolationNumber };
