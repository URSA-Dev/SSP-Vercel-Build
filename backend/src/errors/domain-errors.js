import { BaseError } from './base-error.js';

export class ValidationError extends BaseError {
  constructor(message, field) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
  }
}

export class NotFoundError extends BaseError {
  constructor(entity, id) {
    super(`${entity} with id '${id}' not found`, 'NOT_FOUND', 404);
  }
}

export class PermissionDeniedError extends BaseError {
  constructor(resource, userId) {
    super(`User '${userId}' does not have access to '${resource}'`, 'PERMISSION_DENIED', 403);
  }
}

export class AuthenticationError extends BaseError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
  }
}

export class FileTooLargeError extends BaseError {
  constructor(sizeBytes, maxBytes) {
    super(`File size ${sizeBytes} exceeds maximum ${maxBytes} bytes`, 'FILE_TOO_LARGE', 413);
  }
}

export class InvalidMimeTypeError extends BaseError {
  constructor(mimeType, allowed) {
    super(`MIME type '${mimeType}' is not allowed. Allowed: ${allowed.join(', ')}`, 'INVALID_MIME_TYPE', 415);
  }
}

export class ConflictError extends BaseError {
  constructor(message) {
    super(message, 'CONFLICT', 409);
  }
}

export class AiServiceError extends BaseError {
  constructor(message, details) {
    super(message, 'AI_SERVICE_ERROR', 502);
    this.details = details;
  }
}

export class WorkflowStateError extends BaseError {
  constructor(currentStatus, attemptedAction) {
    super(`Cannot '${attemptedAction}' in '${currentStatus}' status`, 'INVALID_WORKFLOW_STATE', 409);
  }
}
