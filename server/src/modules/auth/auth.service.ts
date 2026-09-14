import bcrypt from 'bcryptjs';
import type { Response } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';
import { generateToken, hashToken } from '../../lib/utils.js';
import { sendMail } from '../../lib/email.js';
import { User } from '../users/user.model.js';
import { PasswordReset, Session } from './session.model.js';
import { getSessionCookieName } from '../../middleware/auth.js';

const BCRYPT_ROUNDS = 12;
const SESSION_DAYS = 14;

export const registerSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120),
  phone: z.string().max(30).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128),
});

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    sameSite: env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none',
    domain: env.COOKIE_DOMAIN || undefined,
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
}

export async function register(input: z.infer<typeof registerSchema>) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) throw new AppError('An account with this email already exists', 409, 'EMAIL_EXISTS');
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
  const user = await User.create({
    email: input.email.toLowerCase(),
    passwordHash,
    fullName: input.fullName,
    phone: input.phone ?? '',
    role: 'customer',
  });
  return { id: user._id, email: user.email, fullName: user.fullName, role: user.role };
}

export async function login(
  input: z.infer<typeof loginSchema>,
  meta: { userAgent?: string; ip?: string },
  res: Response,
) {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
  if (!user || !user.isActive) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');

  const rawToken = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await Session.create({
    userId: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt,
    userAgent: meta.userAgent ?? '',
    ip: meta.ip ?? '',
  });
  user.lastLoginAt = new Date();
  await user.save();

  res.cookie(getSessionCookieName(), rawToken, cookieOptions());
  return { id: user._id, email: user.email, fullName: user.fullName, role: user.role };
}

export async function logout(req: { sessionId?: string; cookies?: Record<string, string> }, res: Response) {
  if (req.sessionId) {
    await Session.findByIdAndUpdate(req.sessionId, { revokedAt: new Date() });
  }
  res.clearCookie(getSessionCookieName(), { path: '/', domain: env.COOKIE_DOMAIN || undefined });
}

export async function requestPasswordReset(email: string) {
  // Always return success message — do not reveal account existence.
  const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
  if (!user) return { accepted: true };

  const raw = generateToken(32);
  await PasswordReset.create({
    userId: user._id,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });

  const resetUrl = `${env.CLIENT_ORIGIN}/reset-password?token=${raw}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your SMART EDGE password',
    text: `Use this link within 1 hour to reset your password:\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
  });
  return { accepted: true };
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hashToken(token);
  const record = await PasswordReset.findOne({
    tokenHash,
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  if (!record) throw new AppError('Invalid or expired reset token', 400, 'INVALID_TOKEN');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await User.findByIdAndUpdate(record.userId, { passwordHash });
  record.usedAt = new Date();
  await record.save();
  await Session.updateMany({ userId: record.userId, revokedAt: { $exists: false } }, { revokedAt: new Date() });
  return { reset: true };
}

export async function createAdminUser(email: string, password: string, fullName: string) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    existing.role = 'admin';
    existing.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    existing.fullName = fullName;
    await existing.save();
    return existing;
  }
  return User.create({
    email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    fullName,
    role: 'admin',
  });
}
