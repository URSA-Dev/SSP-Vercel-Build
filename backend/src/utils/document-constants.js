/** Maximum file size in bytes (50 MB) */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

/** Allowed MIME types for document upload */
export const ALLOWED_MIME_TYPES = [
  // PDF
  'application/pdf',
  // Office
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'image/bmp',
  // Text
  'text/plain',
  'text/csv',
];

/** Regex to sanitize filenames — removes dangerous characters */
export const FILENAME_SANITIZE_RE = /[^\w\-. ]/g;

/** Regex to detect path traversal attempts */
export const PATH_TRAVERSAL_RE = /\.\./;

/** Case status workflow transitions */
export const CASE_STATUS_TRANSITIONS = {
  DRAFT: ['OPEN'],
  OPEN: ['IN_PROGRESS', 'CLOSED', 'CANCELLED'],
  IN_PROGRESS: ['PENDING_REVIEW', 'ON_HOLD', 'CLOSED'],
  PENDING_REVIEW: ['IN_PROGRESS', 'APPROVED', 'REJECTED'],
  APPROVED: ['CLOSED'],
  REJECTED: ['IN_PROGRESS'],
  ON_HOLD: ['IN_PROGRESS', 'CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

/** Document status values */
export const DOCUMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  FAILED: 'failed',
};

/**
 * Sanitize a filename — remove dangerous characters and path traversal.
 * @param {string} filename
 * @returns {string}
 */
export function sanitizeFilename(filename) {
  let name = filename.replace(FILENAME_SANITIZE_RE, '_');
  name = name.replace(PATH_TRAVERSAL_RE, '');
  name = name.replace(/^[_. ]+|[_. ]+$/g, '');
  return name.slice(0, 255) || 'unnamed';
}
