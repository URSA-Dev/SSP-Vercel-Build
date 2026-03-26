/**
 * Schema-based request validation middleware.
 *
 * Validates req.body and req.params against a simple rule DSL.
 * No external validation library required.
 *
 * Supported rules (pipe-delimited):
 *   required        — field must be present and non-empty
 *   string          — must be typeof string
 *   number          — must be typeof number
 *   boolean         — must be typeof boolean
 *   email           — basic email format check
 *   uuid            — UUID v4 format
 *   maxLength:N     — string length <= N
 *   minLength:N     — string length >= N
 *   in:a,b,c        — value must be one of the listed options
 *
 * Usage:
 *   validate({
 *     body:   { last_name: 'required|string', email: 'required|email' },
 *     params: { id: 'required|uuid' },
 *   })
 */
export function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    if (schema.body) {
      validateSource(req.body, schema.body, errors);
    }

    if (schema.params) {
      validateSource(req.params, schema.params, errors, 'parameter');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }

    next();
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSource(source, fields, errors, suffix = '') {
  for (const [field, rules] of Object.entries(fields)) {
    const value = source?.[field];
    const ruleList = rules.split('|');
    const label = suffix ? `${field} ${suffix}` : field;

    for (const rule of ruleList) {
      if (rule === 'required' && (value === undefined || value === null || value === '')) {
        errors.push({ field, message: `${label} is required` });
        break; // skip further checks — value is missing
      }

      // Remaining rules only apply when a value is present
      if (value === undefined || value === null) continue;

      if (rule === 'string' && typeof value !== 'string') {
        errors.push({ field, message: `${label} must be a string` });
      }

      if (rule === 'number' && typeof value !== 'number') {
        errors.push({ field, message: `${label} must be a number` });
      }

      if (rule === 'boolean' && typeof value !== 'boolean') {
        errors.push({ field, message: `${label} must be a boolean` });
      }

      if (rule === 'email' && !EMAIL_RE.test(value)) {
        errors.push({ field, message: `${label} must be a valid email` });
      }

      if (rule === 'uuid' && !UUID_RE.test(value)) {
        errors.push({ field, message: `${label} must be a valid UUID` });
      }

      if (rule.startsWith('maxLength:')) {
        const max = parseInt(rule.split(':')[1], 10);
        if (typeof value === 'string' && value.length > max) {
          errors.push({ field, message: `${label} must be at most ${max} characters` });
        }
      }

      if (rule.startsWith('minLength:')) {
        const min = parseInt(rule.split(':')[1], 10);
        if (typeof value === 'string' && value.length < min) {
          errors.push({ field, message: `${label} must be at least ${min} characters` });
        }
      }

      if (rule.startsWith('in:')) {
        const allowed = rule.split(':')[1].split(',');
        if (!allowed.includes(String(value))) {
          errors.push({ field, message: `${label} must be one of: ${allowed.join(', ')}` });
        }
      }
    }
  }
}
