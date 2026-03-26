import db from '../config/database.js';

const TABLE = 'users';
const SAFE_FIELDS = [
  'id', 'email', 'last_name', 'first_initial',
  'role', 'unit', 'preferences', 'created_at', 'updated_at',
];

/**
 * Find a user by email address (active accounts only).
 * Returns the full row including password_hash for auth comparison.
 */
export async function findByEmail(email) {
  return db(TABLE)
    .where({ email })
    .whereNull('deleted_at')
    .first();
}

/**
 * Find a user by primary key (active accounts only).
 * Excludes password_hash from the result.
 */
export async function findById(id) {
  return db(TABLE)
    .select(SAFE_FIELDS)
    .where({ id })
    .whereNull('deleted_at')
    .first();
}

/**
 * Update allowed profile fields for a user.
 * Returns the updated user without password_hash.
 */
export async function update(id, data) {
  const allowed = ['last_name', 'first_initial', 'preferences'];
  const updates = {};

  for (const key of allowed) {
    if (data[key] !== undefined) {
      updates[key] = data[key];
    }
  }

  if (Object.keys(updates).length === 0) {
    return findById(id);
  }

  updates.updated_at = new Date();

  await db(TABLE).where({ id }).update(updates);
  return findById(id);
}

export default { findByEmail, findById, update };
