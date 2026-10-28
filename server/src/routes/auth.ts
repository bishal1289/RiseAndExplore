import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { asyncHandler, HttpError } from '../lib/http.js';
import { validate } from '../middleware/validate.js';
import { clearSession, requireAuth, setSession } from '../middleware/auth.js';
import { forgotSchema, loginSchema, resetSchema } from '../schemas/index.js';
import { User } from '../models/User.js';
import { actionEmail, sendMail } from '../lib/mailer.js';
import { env } from '../config/env.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait 15 minutes and try again.' },
});

export const hashToken = (t: string) => crypto.createHash('sha256').update(t).digest('hex');

/** Creates a one-time token on the user and returns the raw value for the email link. */
export async function issueToken(
  user: InstanceType<typeof User>,
  purpose: 'reset' | 'invite',
  hours: number,
) {
  const raw = crypto.randomBytes(32).toString('hex');
  user.tokenHash = hashToken(raw);
  user.tokenPurpose = purpose;
  user.tokenExpires = new Date(Date.now() + hours * 60 * 60 * 1000);
  await user.save();
  return raw;
}

authRouter.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    const ok = user?.passwordHash && (await bcrypt.compare(req.body.password, user.passwordHash));
    if (!user || !ok) throw new HttpError(401, 'That email and password don’t match');
    if (!user.active) throw new HttpError(403, 'This account has been deactivated');
    user.lastLoginAt = new Date();
    await user.save();
    setSession(res, user.id);
    res.json(user.toJSON());
  }),
);

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(req.user!.toJSON());
  }),
);

authRouter.post(
  '/forgot',
  loginLimiter,
  validate(forgotSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email.toLowerCase(), active: true });
    if (user) {
      const token = await issueToken(user, 'reset', 1);
      const link = `${env.SITE_URL}/admin/reset-password?token=${token}`;
      await sendMail({
        to: user.email,
        subject: 'Reset your RISE admin password',
        html: actionEmail(
          'Reset your password',
          'Someone asked to reset the password for your RISE admin account. This link works for 1 hour.',
          'Choose a new password',
          link,
        ),
      });
    }
    // Same response either way so emails can't be probed.
    res.json({ ok: true });
  }),
);

/** Used by both the password-reset link and the invitation link. */
authRouter.post(
  '/reset',
  loginLimiter,
  validate(resetSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findOne({
      tokenHash: hashToken(req.body.token),
      tokenExpires: { $gt: new Date() },
    });
    if (!user) throw new HttpError(400, 'This link has expired. Please request a new one.');
    user.passwordHash = await bcrypt.hash(req.body.password, 12);
    if (req.body.name) user.name = req.body.name;
    user.tokenHash = '';
    user.tokenPurpose = '';
    user.tokenExpires = undefined;
    user.active = true;
    user.lastLoginAt = new Date();
    await user.save();
    setSession(res, user.id);
    res.json(user.toJSON());
  }),
);
