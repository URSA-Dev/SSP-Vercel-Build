/**
 * Global Express error handler.
 *
 * Catches all errors forwarded via next(err) and responds with the
 * project-standard error envelope: { error: { code, message } }.
 *
 * In development, 500-level errors include the stack trace.
 */
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  if (status === 500) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err);
  }

  res.status(status).json({
    error: {
      code: err.code || statusToCode(status),
      message,
      ...(process.env.NODE_ENV === 'development' && status === 500 && { stack: err.stack }),
    },
  });
}

/**
 * Creates a throwable HTTP error with status, message, and optional code.
 *
 *   throw createError(404, 'Case not found', 'CASE_NOT_FOUND');
 */
export function createError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  if (code) err.code = code;
  return err;
}

/**
 * Catch-all handler for routes that don't match any defined endpoint.
 * Mount after all other routes.
 */
export function notFound(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

function statusToCode(status) {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'UNPROCESSABLE_ENTITY';
  if (status === 429) return 'RATE_LIMITED';
  return 'INTERNAL_ERROR';
}
