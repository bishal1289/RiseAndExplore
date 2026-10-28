import type { CookieOptions, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../lib/http.js';
import { User, type Role, type UserDoc } from '../models/User.js';

export const AUTH_COOKIE = 'rise_session';
export const SESSION_DAYS = 7;

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserDoc;
  }
}

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  // Frontend (Vercel) and API (Render) live on different domains in production,
  // so the cookie must be cross-site.
  sameSite: env.isProd ? 'none' : 'lax',
  secure: env.isProd,
  maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
  path: '/',
};

export function setSession(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
  res.cookie(AUTH_COOKIE, token, cookieOptions);
}

export function clearSession(res: Response) {
  const { maxAge: _maxAge, ...rest } = cookieOptions;
  res.clearCookie(AUTH_COOKIE, rest);
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[AUTH_COOKIE];
    if (!token) throw new HttpError(401, 'Please sign in');
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const user = await User.findById(payload.sub);
    if (!user || !user.active) throw new HttpError(401, 'Please sign in');
    req.user = user;
    next();
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(401, 'Your session expired. Please sign in again.'));
  }
}

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role as Role)) {
      return next(new HttpError(403, 'Only the account owner can do this'));
    }
    next();
  };
