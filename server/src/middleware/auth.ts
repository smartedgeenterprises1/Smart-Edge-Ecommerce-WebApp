import type { NextFunction, Request, Response } from 'express';
import { Session } from '../modules/auth/session.model.js';
import { User, type UserDocument } from '../modules/users/user.model.js';
import { hashToken } from '../lib/utils.js';
import { AppError } from '../lib/errors.js';

export type AuthUser = Pick<UserDocument, 'email' | 'fullName' | 'role' | 'isActive'> & {
  _id: UserDocument['_id'];
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      sessionId?: string;
      csrfToken?: string;
    }
  }
}

const SESSION_COOKIE = 'se_session';

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export async function loadSession(req: Request, _res: Response, next: NextFunction) {
  try {
    const raw = req.cookies?.[SESSION_COOKIE] as string | undefined;
    if (!raw) return next();
    const tokenHash = hashToken(raw);
    const session = await Session.findOne({
      tokenHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });
    if (!session) return next();
    const user = await User.findById(session.userId).select('email fullName role isActive');
    if (!user || !user.isActive) return next();
    req.user = {
      _id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    };
    req.sessionId = String(session._id);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
  if (req.user.role !== 'admin') return next(new AppError('Admin access required', 403, 'FORBIDDEN'));
  next();
}

export function optionalAuth(_req: Request, _res: Response, next: NextFunction) {
  next();
}
