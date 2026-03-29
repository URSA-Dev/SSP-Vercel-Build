import { describe, it, expect, vi } from 'vitest';
import { errorHandler, notFound } from '../../src/middleware/error-handler.js';

describe('errorHandler', () => {
  function mockRes() {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  }

  it('returns 500 for generic errors', () => {
    const err = new Error('something broke');
    const req = { method: 'GET', path: '/test' };
    const res = mockRes();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        }),
      })
    );
  });

  it('returns custom status code from error', () => {
    const err = new Error('Not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    const req = { method: 'GET', path: '/test' };
    const res = mockRes();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'NOT_FOUND', message: 'Not found' }),
      })
    );
  });
});

describe('notFound', () => {
  it('returns 404 with route info', () => {
    const req = { method: 'GET', path: '/nonexistent' };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    notFound(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: expect.stringContaining('/nonexistent'),
        }),
      })
    );
  });
});
