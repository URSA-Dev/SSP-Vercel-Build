import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Valid email is required'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    last_name: z.string().min(1, 'Last name is required'),
    first_initial: z.string().max(1).min(1, 'First initial is required'),
    role: z.enum(['analyst', 'supervisor', 'admin']).default('analyst'),
  }),
});
