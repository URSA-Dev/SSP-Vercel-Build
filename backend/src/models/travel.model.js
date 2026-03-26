import db from '../config/database.js';

const TABLE = 'foreign_travel';

/**
 * List foreign travel records with filtering and pagination.
 * Returns { rows, total } for paginated responses.
 */
export async function findAll(filters = {}, pagination = {}) {
  const { limit = 25, offset = 0 } = pagination;

  let query = db(TABLE).whereNull(`${TABLE}.deleted_at`);

  if (filters.status) {
    query = query.where(`${TABLE}.status`, filters.status);
  }
  if (filters.risk_level) {
    query = query.where(`${TABLE}.risk_level`, filters.risk_level);
  }
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.where(function () {
      this.whereILike(`${TABLE}.subject_name`, term)
        .orWhereILike(`${TABLE}.travel_id`, term)
        .orWhereILike(`${TABLE}.countries`, term);
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
 * Retrieve a single travel record by ID.
 */
export async function findById(id) {
  return db(TABLE)
    .where({ id })
    .whereNull('deleted_at')
    .first();
}

/**
 * Insert a new travel record and return it.
 */
export async function create(data) {
  const [row] = await db(TABLE).insert(data).returning('*');
  return row;
}

/**
 * Update travel record fields and return the updated row.
 */
export async function update(id, data) {
  data.updated_at = new Date();
  const [row] = await db(TABLE).where({ id }).update(data).returning('*');
  return row;
}

/**
 * Soft-delete a travel record.
 */
export async function softDelete(id) {
  await db(TABLE).where({ id }).update({
    deleted_at: new Date(),
    updated_at: new Date(),
  });
}

/**
 * Aggregate stats for the foreign travel dashboard.
 */
export async function getStats() {
  const base = db(TABLE).whereNull('deleted_at');

  const [inTravel, debriefPending, referred, highRisk] = await Promise.all([
    base.clone().where({ status: 'IN TRAVEL' }).count('* as count').first(),
    base.clone().where({ status: 'DEBRIEF PENDING' }).count('* as count').first(),
    base.clone().where({ status: 'REFERRED' }).count('* as count').first(),
    base.clone().where({ risk_level: 'HIGH' }).count('* as count').first(),
  ]);

  return {
    inTravel: parseInt(inTravel.count, 10),
    debriefPending: parseInt(debriefPending.count, 10),
    referred: parseInt(referred.count, 10),
    highRisk: parseInt(highRisk.count, 10),
  };
}

/**
 * Generate the next FT-YYYY-XXX travel identifier.
 */
export async function getNextTravelId() {
  const year = new Date().getFullYear();
  const prefix = `FT-${year}-`;

  const latest = await db(TABLE)
    .where('travel_id', 'like', `${prefix}%`)
    .orderBy('travel_id', 'desc')
    .first();

  let sequence = 1;
  if (latest) {
    const parts = latest.travel_id.split('-');
    const lastSeq = parseInt(parts[2], 10);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `${prefix}${String(sequence).padStart(3, '0')}`;
}

export default { findAll, findById, create, update, softDelete, getStats, getNextTravelId };
