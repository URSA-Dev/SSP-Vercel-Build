import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import db from '../config/database.js';
import logger from '../utils/logger.js';

const log = logger.child({ module: 'auth' });

/**
 * Middleware that verifies a JWT Bearer token and attaches the
 * authenticated user to req.user.  Returns 401 on missing, expired,
 * or invalid tokens as well as when the referenced user no longer
 * exists in the database.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    // Look up user to confirm the account is still active
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
        log.error({ err }, 'Auth DB lookup failed');
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

/**
 * Optional authentication — sets req.user when a valid token is
 * present but allows the request to proceed without one.
 */
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    db('users')
      .where({ id: decoded.sub })
      .whereNull('deleted_at')
      .first()
      .then((user) => {
        req.user = user
          ? {
              id: user.id,
              email: user.email,
              last_name: user.last_name,
              first_initial: user.first_initial || '',
              role: user.role,
            }
          : null;
        next();
      })
      .catch(() => {
        req.user = null;
        next();
      });
  } catch {
    req.user = null;
    next();
  }
}
