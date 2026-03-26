/**
 * Pagination utilities for list endpoints.
 *
 * Backend rule: max 100 items per page, default 25.
 */

/**
 * Parse page/limit from a query-string object and return the
 * computed offset.  Clamps values to safe bounds.
 *
 *   const { page, limit, offset } = parsePagination(req.query);
 */
export function parsePagination(query) {
  let page = parseInt(query.page, 10) || 1;
  let limit = parseInt(query.limit, 10) || 25;

  if (page < 1) page = 1;
  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Build the metadata object that accompanies paginated responses.
 *
 *   res.json({ data: rows, pagination: paginationMeta(total, page, limit) });
 */
export function paginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Express middleware that parses pagination from the query string
 * and attaches { page, limit, offset } to req.pagination.
 *
 *   router.get('/cases', paginate, listCases);
 */
export function paginate(req, res, next) {
  req.pagination = parsePagination(req.query);
  next();
}
