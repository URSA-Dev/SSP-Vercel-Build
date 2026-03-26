import db from '../config/database.js';

const TABLE = 'fcl_records';

/**
 * List FCL records with filtering and pagination.
 * Returns { rows, total } for paginated responses.
 */
export async function findAll(filters = {}, pagination = {}) {
  const { limit = 25, offset = 0 } = pagination;

  let query = db(TABLE).whereNull(`${TABLE}.deleted_at`);

  if (filters.status) {
    query = query.where(`${TABLE}.status`, filters.status);
  }
  if (filters.clearance_level) {
    query = query.where(`${TABLE}.clearance_level`, filters.clearance_level);
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.where(function () {
      this.whereILike(`${TABLE}.entity_name`, term)
        .orWhereILike(`${TABLE}.fcl_id`, term)
        .orWhereILike(`${TABLE}.cage_code`, term);
    });
  }

  const countQuery = query.clone().count('* as count').first();
  const { count: total } = await countQuery;

  const rows = await query
    .select(`${TABLE}.*`)
    .orderBy(`${TABLE}.entity_name`, 'asc')
    .limit(limit)
    .offset(offset);

  return { rows, total: parseInt(total, 10) };
}

/**
 * Retrieve a single FCL record by ID.
 */
export async function findById(id) {
  return db(TABLE)
    .where({ id })
    .whereNull('deleted_at')
    .first();
}

/**
 * Insert a new FCL record and return it.
 */
export async function create(data) {
  const [row] = await db(TABLE).insert(data).returning('*');
  return row;
}

/**
 * Update FCL record fields and return the updated row.
 */
export async function update(id, data) {
  data.updated_at = new Date();
  const [row] = await db(TABLE).where({ id }).update(data).returning('*');
  return row;
}

/**
 * Soft-delete an FCL record.
 */
export async function softDelete(id) {
  await db(TABLE).where({ id }).update({
    deleted_at: new Date(),
    updated_at: new Date(),
  });
}

/**
 * Aggregate stats for the FCL dashboard.
 */
export async function getStats() {
  const base = db(TABLE).whereNull('deleted_at');

  const [active, pending, suspended, expiring] = await Promise.all([
    base.clone().where({ status: 'Active' }).count('* as count').first(),
    base.clone().where({ status: 'Pending' }).count('* as count').first(),
    base.clone().where({ status: 'Suspended' }).count('* as count').first(),
    base.clone()
      .where({ status: 'Active' })
      .whereNotNull('expires_at')
      .whereRaw("expires_at <= NOW() + INTERVAL '120 days'")
      .whereRaw('expires_at > NOW()')
      .count('* as count')
      .first(),
  ]);

  return {
    active: parseInt(active.count, 10),
    pending: parseInt(pending.count, 10),
    suspended: parseInt(suspended.count, 10),
    expiring: parseInt(expiring.count, 10),
  };
}

/**
 * Generate the next FCL-XXX identifier.
 */
export async function getNextFclId() {
  const prefix = 'FCL-';

  const latest = await db(TABLE)
    .where('fcl_id', 'like', `${prefix}%`)
    .orderBy('fcl_id', 'desc')
    .first();

  let sequence = 1;
  if (latest) {
    const parts = latest.fcl_id.split('-');
    const lastSeq = parseInt(parts[1], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

export default { findAll, findById, create, update, softDelete, getStats, getNextFclId };
