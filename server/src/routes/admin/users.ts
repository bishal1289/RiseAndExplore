import { Router } from 'express';
import { asyncHandler, HttpError, notFound } from '../../lib/http.js';
import { validate } from '../../middleware/validate.js';
import { inviteSchema, userUpdateSchema } from '../../schemas/index.js';
import { User } from '../../models/User.js';
import { issueToken } from '../auth.js';
import { actionEmail, sendMail } from '../../lib/mailer.js';
import { env } from '../../config/env.js';
import { logActivity } from '../../lib/activity.js';

/** Mounted behind requireRole('owner'). */
export const usersRouter = Router();

usersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await User.find().sort({ createdAt: 1 });
    res.json(users.map((u) => u.toJSON()));
  }),
);

async function sendInvite(user: InstanceType<typeof User>, inviter: string) {
  const token = await issueToken(user, 'invite', 72);
  await sendMail({
    to: user.email,
    subject: 'You’re invited to the RISE website admin',
    html: actionEmail(
      'Join the RISE admin panel',
      `${inviter} invited you to help manage the RISE website. This link works for 3 days.`,
      'Set up my account',
      `${env.SITE_URL}/admin/reset-password?token=${token}&invite=1`,
    ),
  });
}

usersRouter.post(
  '/invite',
  validate(inviteSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    if (await User.exists({ email })) throw new HttpError(409, 'Someone with that email already has an account');
    const user = await User.create({ email, name: req.body.name, role: req.body.role, active: true });
    await sendInvite(user, req.user?.name || req.user?.email || 'The RISE team');
    await logActivity(req, 'created', 'User', user._id, `Invited ${email}`);
    res.status(201).json(user.toJSON());
  }),
);

usersRouter.post(
  '/:id/resend-invite',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw notFound('User');
    if (user.passwordHash) throw new HttpError(400, 'This person has already set up their account');
    await sendInvite(user, req.user?.name || req.user?.email || 'The RISE team');
    res.json({ ok: true });
  }),
);

usersRouter.put(
  '/:id',
  validate(userUpdateSchema),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw notFound('User');
    const demotingOrDeactivating = req.body.role === 'editor' || req.body.active === false;
    if (user.role === 'owner' && demotingOrDeactivating) {
      const owners = await User.countDocuments({ role: 'owner', active: true });
      if (owners <= 1) throw new HttpError(400, 'There must always be at least one active owner');
    }
    user.set(req.body);
    await user.save();
    await logActivity(req, 'updated', 'User', user._id, user.email);
    res.json(user.toJSON());
  }),
);
