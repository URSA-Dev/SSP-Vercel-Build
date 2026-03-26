import { BaseError } from './base-error.js';

export class ValidationError extends BaseError {
  /**
   * @param {string} message
   * @param {string} [field]
   */
  constructor(message, field) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
  }
}

export class NotFoundError extends BaseError {
  /**
   * @param {string} entity - Entity type (e.g., 'Case', 'Document')
   * @param {string} id - Entity ID
   */
  constructor(entity, id) {
    super(`${entity} with id '${id}' not found`, 'NOT_FOUND', 404);
  }
}

export class PermissionDeniedError extends BaseError {
  /**
   * @param {string} resource - Resource identifier
   * @param {string} userId - User who was denied
   */
  constructor(resource, userId) {
    super(
      `User '${userId}' does not have access to '${resource}'`,
      'PERMISSION_DENIED',
      403
    );
  }
}

export class AuthenticationError extends BaseError {
  /** @param {string} [message] */
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class FileTooLargeError extends BaseError {
  /**
   * @param {number} sizeBytes
   * @param {number} maxBytes
   */
  constructor(sizeBytes, maxBytes) {
    super(
      `File size ${sizeBytes} exceeds maximum ${maxBytes} bytes`,
      'FILE_TOO_LARGE',
      413
    );
  }
}

export class InvalidMimeTypeError extends BaseError {
  /**
   * @param {string} mimeType
   * @param {string[]} allowed
   */
  constructor(mimeType, allowed) {
    super(
      `MIME type '${mimeType}' is not allowed. Allowed: ${allowed.join(', ')}`,
      'INVALID_MIME_TYPE',
      415
    );
  }
}

export class ConflictError extends BaseError {
  /** @param {string} message */
  constructor(message) {
    super(message, 'CONFLICT', 409);
  }
}

export class WorkflowStateError extends BaseError {
  /**
   * @param {string} currentStatus
   * @param {string} attemptedAction
   */
  constructor(currentStatus, attemptedAction) {
    super(
      `Cannot '${attemptedAction}' in '${currentStatus}' status`,
      'INVALID_WORKFLOW_STATE',
      409
    );
  }
}
