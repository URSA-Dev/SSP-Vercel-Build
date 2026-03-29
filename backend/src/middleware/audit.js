import db from '../config/database.js';
import logger from '../utils/logger.js';

const log = logger.child({ module: 'audit' });

/**
 * Audit logging middleware.  Intercepts res.json() on mutating HTTP
 * methods (POST, PUT, PATCH, DELETE) and writes a row to audit_log
 * after the response payload has been determined.
 *
 * Usage:  router.post('/cases', auditLog('case'), createCase);
 *
 * Audit failures are logged to stderr but never block the response.
 */
export function auditLog(entityType) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async (data) => {
      const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
      const isSuccess = res.statusCode < 400;

      if (isMutation && isSuccess) {
        try {
          await db('audit_log').insert({
            user_name: req.user
              ? `${req.user.last_name}, ${req.user.first_initial}.`
              : 'System',
            action: `${req.method} ${req.originalUrl}`,
            detail: summarizeAction(req, data),
            entity_type: entityType,
            entity_id: req.params.id || data?.id || null,
            ip_address: req.ip,
          });
        } catch (err) {
          log.error({ err }, 'Audit log write failed');
        }
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Generates a concise, human-readable description for the audit
 * entry based on the HTTP method and target path.
 */
function summarizeAction(req, data) {
  const { method, originalUrl } = req;

  switch (method) {
    case 'POST':
      return `Created via ${originalUrl}`;
    case 'PUT':
    case 'PATCH':
      return `Updated via ${originalUrl}`;
    case 'DELETE':
      return `Deleted via ${originalUrl}`;
    default:
      return `${method} ${originalUrl}`;
  }
}
