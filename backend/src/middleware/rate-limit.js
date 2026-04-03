import rateLimit from 'express-rate-limit';

/**
 * Login rate limiter — prevents brute-force attacks on auth endpoints.
 * 5 attempts per 15 minutes per IP.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many login attempts. Please try again in 15 minutes.',
    },
  },
});

/**
 * Global API rate limiter — prevents abuse across all endpoints.
 * 100 requests per minute per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please slow down.',
    },
  },
});
