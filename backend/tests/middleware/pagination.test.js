import { describe, it, expect, vi } from 'vitest';
import { parsePagination, paginationMeta, paginate } from '../../src/middleware/pagination.js';

describe('parsePagination', () => {
  it('returns defaults when no params', () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, limit: 25, offset: 0 });
  });

  it('parses page and limit', () => {
    const result = parsePagination({ page: '3', limit: '10' });
    expect(result).toEqual({ page: 3, limit: 10, offset: 20 });
  });

  it('clamps limit to 100', () => {
    const result = parsePagination({ limit: '999' });
    expect(result.limit).toBe(100);
  });

  it('clamps negative page to 1', () => {
    const result = parsePagination({ page: '-5' });
    expect(result.page).toBe(1);
  });
});

describe('paginationMeta', () => {
  it('calculates correct meta', () => {
    const meta = paginationMeta(100, 2, 25);
    expect(meta).toEqual({
      page: 2, limit: 25, total: 100, totalPages: 4, hasNext: true, hasPrev: true,
    });
  });

  it('handles last page', () => {
    const meta = paginationMeta(50, 2, 25);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(true);
  });
});

describe('paginate middleware', () => {
  it('attaches pagination to req', () => {
    const req = { query: { page: '2', limit: '10' } };
    const next = vi.fn();

    paginate(req, {}, next);

    expect(req.pagination).toEqual({ page: 2, limit: 10, offset: 10 });
    expect(next).toHaveBeenCalled();
  });
});
