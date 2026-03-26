import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import UserModel from '../models/user.model.js';
import { createError } from '../middleware/error-handler.js';

/**
 * POST /api/v1/auth/login
 * Authenticate with email + password, return JWT and user profile.
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required',
        },
      });
    }

    const user = await UserModel.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
      });
    }

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    );

    const { password_hash: _, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 * Client-side token removal; server acknowledges.
 */
export async function logout(req, res, next) {
  try {
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/auth/me
 * Return the authenticated user's profile.
 */
export async function getMe(req, res, next) {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      throw createError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/auth/me
 * Update the authenticated user's profile fields.
 */
export async function updateMe(req, res, next) {
  try {
    const { last_name, first_initial, preferences } = req.body;

    if (!last_name && !first_initial && preferences === undefined) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'At least one field is required: last_name, first_initial, or preferences',
        },
      });
    }

    const updated = await UserModel.update(req.user.id, {
      last_name,
      first_initial,
      preferences,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export default { login, logout, getMe, updateMe };
