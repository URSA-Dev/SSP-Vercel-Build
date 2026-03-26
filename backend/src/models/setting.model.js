import db from '../config/database.js';

const TABLE = 'settings';

/**
 * Find all settings for a given scope (tenant or user).
 */
export async function findAll(scope, scopeId) {
  return db(TABLE)
    .where({ scope, scope_id: scopeId })
    .orderBy('key', 'asc');
}

/**
 * Find a single setting by key for a given scope.
 */
export async function findByKey(scope, scopeId, key) {
  return db(TABLE)
    .where({ scope, scope_id: scopeId, key })
    .first();
}

/**
 * Upsert a setting value (JSONB).
 * Uses ON CONFLICT to insert or update.
 */
export async function upsert(scope, scopeId, key, value) {
  const now = new Date();

  const [row] = await db.raw(
    `INSERT INTO ${TABLE} (scope, scope_id, key, value, created_at, updated_at)
     VALUES (?, ?, ?, ?::jsonb, ?, ?)
     ON CONFLICT (scope, scope_id, key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at
     RETURNING *`,
    [scope, scopeId, key, JSON.stringify(value), now, now],
  );

  return row.rows ? row.rows[0] : row;
}

export default { findAll, findByKey, upsert };
