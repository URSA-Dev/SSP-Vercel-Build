import NotificationModel from '../models/notification.model.js';
import { createError } from '../middleware/error-handler.js';
import { parsePagination, paginationMeta } from '../middleware/pagination.js';

/**
 * GET /api/v1/notifications
 * List notifications for the current user, unread first.
 */
export async function listNotifications(req, res, next) {
  try {
    const pagination = parsePagination(req.query);
    const { rows, total } = await NotificationModel.findByUserId(req.user.id, pagination);

    res.json({
      data: rows,
      pagination: paginationMeta(total, pagination.page, pagination.limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a single notification as read.
 */
export async function markRead(req, res, next) {
  try {
    const notification = await NotificationModel.findById(req.params.id);

    if (!notification) {
      throw createError(404, 'Notification not found', 'NOTIFICATION_NOT_FOUND');
    }

    if (notification.user_id !== req.user.id) {
      throw createError(403, 'Not authorized to modify this notification', 'FORBIDDEN');
    }

    const updated = await NotificationModel.update(req.params.id, { read: true });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/notifications/read-all
 * Mark all notifications as read for the current user.
 */
export async function markAllRead(req, res, next) {
  try {
    const count = await NotificationModel.markAllRead(req.user.id);
    res.json({ message: 'All notifications marked as read', count });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/notifications/clear
 * Delete all notifications for the current user.
 */
export async function clearAll(req, res, next) {
  try {
    const count = await NotificationModel.clearByUserId(req.user.id);
    res.json({ message: 'All notifications cleared', count });
  } catch (err) {
    next(err);
  }
}

export default { listNotifications, markRead, markAllRead, clearAll };
