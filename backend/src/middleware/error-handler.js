import logger from '../utils/logger.js';

const log = logger.child({ module: 'error-handler' });

export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || err.status || 500;
  const message = status === 500 && err.isOperational !== true ? 'Internal server error' : err.message;

  if (status >= 500) {
    log.error({ err, method: req.method, path: req.path }, 'Server error');
  }

  res.status(status).json({
    error: {
      code: err.code || statusToCode(status),
      message,
      ...(err.field && { field: err.field }),
      ...(err.details && { details: err.details }),
      ...(process.env.NODE_ENV === 'development' && status === 500 && { stack: err.stack }),
    },
  });
}

export function createError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  if (code) err.code = code;
  return err;
}

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
