import db from '../config/database.js';

const TABLE = 'notifications';

/**
 * Find notifications for a user, unread first, paginated.
 */
export async function findByUserId(userId, { limit, offset } = {}) {
  const query = db(TABLE)
    .where('user_id', userId)
    .orderByRaw('read ASC, created_at DESC');

  const countQuery = query.clone().clearOrder().count('* as total').first();
  const [{ total }] = await Promise.all([countQuery]);

  const rows = await query.limit(limit).offset(offset);

  return { rows, total: parseInt(total, 10) };
}

/**
 * Find a single notification by ID.
 */
export async function findById(id) {
  return db(TABLE).where({ id }).first();
}

/**
 * Update a notification row.
 */
export async function update(id, data) {
  const updates = { ...data, updated_at: new Date() };
  await db(TABLE).where({ id }).update(updates);
  return findById(id);
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllRead(userId) {
  const count = await db(TABLE)
    .where({ user_id: userId, read: false })
    .update({ read: true, updated_at: new Date() });
  return count;
}

/**
 * Delete all notifications for a user.
 */
export async function clearByUserId(userId) {
  const count = await db(TABLE)
    .where({ user_id: userId })
    .del();
  return count;
}

export default { findByUserId, findById, update, markAllRead, clearByUserId };
