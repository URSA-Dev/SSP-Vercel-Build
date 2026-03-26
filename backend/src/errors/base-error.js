/**
 * Base error class for SSP application errors.
 * All domain errors extend this for consistent error handling.
 */
export class BaseError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {string} code - Machine-readable error code
   * @param {number} statusCode - HTTP status code
   * @param {boolean} [isOperational=true] - Whether this is an expected error
   */
  constructor(message, code, statusCode, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp,
      },
    };
  }
}
