import db from '../config/database.js';
import { parsePagination, paginationMeta } from '../middleware/pagination.js';

/**
 * GET /api/v1/audit
 * List audit log entries with pagination and filters.
 */
export async function listAuditLog(req, res, next) {
  try {
    const pagination = parsePagination(req.query);

    const query = db('audit_log')
      .select('*')
      .orderBy('created_at', 'desc');

    if (req.query.entity_type) {
      query.where('entity_type', req.query.entity_type);
    }

    if (req.query.action) {
      query.where('action', 'ilike', `%${req.query.action}%`);
    }

    if (req.query.user_name) {
      query.where('user_name', 'ilike', `%${req.query.user_name}%`);
    }

    if (req.query.date_from) {
      query.where('created_at', '>=', req.query.date_from);
    }

    if (req.query.date_to) {
      query.where('created_at', '<=', req.query.date_to);
    }

    const countQuery = query.clone().clearSelect().clearOrder().count('* as total').first();
    const { total } = await countQuery;

    const rows = await query.limit(pagination.limit).offset(pagination.offset);

    res.json({
      data: rows,
      pagination: paginationMeta(parseInt(total, 10), pagination.page, pagination.limit),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/audit/export
 * Export audit log entries as CSV.
 */
export async function exportCsv(req, res, next) {
  try {
    const query = db('audit_log')
      .select('*')
      .orderBy('created_at', 'desc');

    if (req.query.entity_type) {
      query.where('entity_type', req.query.entity_type);
    }

    if (req.query.action) {
      query.where('action', 'ilike', `%${req.query.action}%`);
    }

    if (req.query.user_name) {
      query.where('user_name', 'ilike', `%${req.query.user_name}%`);
    }

    if (req.query.date_from) {
      query.where('created_at', '>=', req.query.date_from);
    }

    if (req.query.date_to) {
      query.where('created_at', '<=', req.query.date_to);
    }

    const rows = await query;

    const headers = ['id', 'user_name', 'action', 'detail', 'entity_type', 'entity_id', 'ip_address', 'created_at'];
    const csvLines = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val);
        // Escape CSV values containing commas, quotes, or newlines
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvLines.push(values.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
    res.send(csvLines.join('\n'));
  } catch (err) {
    next(err);
  }
}

export default { listAuditLog, exportCsv };
