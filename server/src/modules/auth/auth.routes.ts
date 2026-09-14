import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.js';
import { ok } from '../../lib/api-response.js';
import { asyncHandler, validateBody } from '../../middleware/error.js';
import { loadSession, requireAuth } from '../../middleware/auth.js';
import {
  forgotPasswordSchema,
  login,
  loginSchema,
  logout,
  register,
  registerSchema,
  requestPasswordReset,
  resetPassword,
  resetPasswordSchema,
} from './auth.service.js';

const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many attempts', code: 'RATE_LIMIT' } },
});

export const authRouter = Router();

authRouter.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const user = await register(req.body);
    ok(res, { user }, 201);
  }),
);

authRouter.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await login(req.body, { userAgent: req.get('user-agent') ?? '', ip: req.ip }, res);
    ok(res, { user });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await logout(req, res);
    ok(res, { loggedOut: true });
  }),
);

authRouter.get(
  '/me',
  loadSession,
  requireAuth,
  asyncHandler(async (req, res) => {
    ok(res, { user: req.user });
  }),
);

authRouter.post(
  '/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req, res) => {
    await requestPasswordReset(req.body.email);
    ok(res, {
      message: 'If an account exists for that email, reset instructions have been prepared.',
    });
  }),
);

authRouter.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    await resetPassword(req.body.token, req.body.password);
    ok(res, { reset: true });
  }),
);
