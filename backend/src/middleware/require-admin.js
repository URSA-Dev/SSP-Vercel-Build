import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import db from '../config/database.js';
import logger from '../utils/logger.js';

const log = logger.child({ module: 'require-admin' });

/**
 * Middleware that enforces ADMIN-only access.
 * Verifies JWT, confirms user exists, and checks role === 'ADMIN'.
 * Returns 401 for missing/invalid tokens, 403 for non-admin users.
 */
export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    db('users')
      .where({ id: decoded.sub })
      .whereNull('deleted_at')
      .first()
      .then((user) => {
        if (!user) {
          return res.status(401).json({
            error: { code: 'UNAUTHORIZED', message: 'User no longer exists' },
          });
        }

        if (user.role !== 'ADMIN') {
          return res.status(403).json({
            error: { code: 'FORBIDDEN', message: 'Admin access required' },
          });
        }

        req.user = {
          id: user.id,
          email: user.email,
          last_name: user.last_name,
          first_initial: user.first_initial || '',
          role: user.role,
        };

        next();
      })
      .catch((err) => {
        log.error({ err }, 'Admin auth DB lookup failed');
        return res.status(500).json({
          error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
        });
      });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
      });
    }
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
    });
  }
}
