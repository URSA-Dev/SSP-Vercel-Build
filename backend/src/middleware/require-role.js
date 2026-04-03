/**
 * Role-based access control middleware.
 * Accepts one or more allowed roles. Must be placed AFTER authenticate middleware.
 *
 * Usage: requireRole('SUPERVISOR', 'ADMIN')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `This action requires one of: ${allowedRoles.join(', ')}`,
        },
      });
    }

    next();
  };
}
