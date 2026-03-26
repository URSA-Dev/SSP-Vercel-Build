import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import db from '../config/database.js';

const router = Router();

// All content read routes require authentication (any role)
router.use(authenticate);

/**
 * GET /api/v1/content/announcements
 * Returns active, non-expired announcements for dashboard display.
 */
router.get('/announcements', async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    const rows = await db('payload.announcements')
      .where('is_active', true)
      .where(function () {
        this.whereNull('published_at').orWhere('published_at', '<=', now);
      })
      .where(function () {
        this.whereNull('expires_at').orWhere('expires_at', '>', now);
      })
      .orderBy('created_at', 'desc');

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/content/help/:slug
 * Returns a single help article by its slug.
 */
router.get('/help/:slug', async (req, res, next) => {
  try {
    const article = await db('payload.help_articles')
      .where('slug', req.params.slug)
      .first();

    if (!article) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Help article not found' },
      });
    }

    res.json({ data: article });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/content/alerts
 * Returns active system alerts within their time window.
 */
router.get('/alerts', async (req, res, next) => {
  try {
    const now = new Date().toISOString();
    const rows = await db('payload.system_alerts')
      .where('is_active', true)
      .where(function () {
        this.whereNull('starts_at').orWhere('starts_at', '<=', now);
      })
      .where(function () {
        this.whereNull('ends_at').orWhere('ends_at', '>', now);
      })
      .orderBy('created_at', 'desc');

    res.json({ data: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
