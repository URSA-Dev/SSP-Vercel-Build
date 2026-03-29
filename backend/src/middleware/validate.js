export function validate(schema) {
  if (schema && typeof schema.safeParse === 'function') {
    return (req, res, next) => {
      const result = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      if (!result.success) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: result.error.issues.map(issue => ({
              field: issue.path.slice(1).join('.') || issue.path[0],
              message: issue.message,
            })),
          },
        });
      }
      if (result.data.body) req.body = result.data.body;
      if (result.data.params) req.params = { ...req.params, ...result.data.params };
      if (result.data.query) req.query = { ...req.query, ...result.data.query };
      next();
    };
  }

  return (req, res, next) => {
    const errors = [];
    if (schema.body) validateSource(req.body, schema.body, errors);
    if (schema.params) validateSource(req.params, schema.params, errors, 'parameter');
    if (errors.length > 0) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: errors },
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
        break;
      }
      if (value === undefined || value === null) continue;
      if (rule === 'string' && typeof value !== 'string') errors.push({ field, message: `${label} must be a string` });
      if (rule === 'number' && typeof value !== 'number') errors.push({ field, message: `${label} must be a number` });
      if (rule === 'boolean' && typeof value !== 'boolean') errors.push({ field, message: `${label} must be a boolean` });
      if (rule === 'email' && !EMAIL_RE.test(value)) errors.push({ field, message: `${label} must be a valid email` });
      if (rule === 'uuid' && !UUID_RE.test(value)) errors.push({ field, message: `${label} must be a valid UUID` });
      if (rule.startsWith('maxLength:')) {
        const max = parseInt(rule.split(':')[1], 10);
        if (typeof value === 'string' && value.length > max) errors.push({ field, message: `${label} must be at most ${max} characters` });
      }
      if (rule.startsWith('minLength:')) {
        const min = parseInt(rule.split(':')[1], 10);
        if (typeof value === 'string' && value.length < min) errors.push({ field, message: `${label} must be at least ${min} characters` });
      }
      if (rule.startsWith('in:')) {
        const allowed = rule.split(':')[1].split(',');
        if (!allowed.includes(String(value))) errors.push({ field, message: `${label} must be one of: ${allowed.join(', ')}` });
      }
    }
  }
}
