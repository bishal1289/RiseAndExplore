import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { eventsAdminRouter } from './events.js';
import { mediaRouter, uploadsRouter } from './media.js';
import {
  albumsRouter,
  galleryRouter,
  homepageRouter,
  impactCardsRouter,
  messagesRouter,
  programsRouter,
  settingsRouter,
  testimonialsRouter,
  volunteersRouter,
} from './content.js';
import { usersRouter } from './users.js';
import { dashboardRouter } from './dashboard.js';
import { trashRouter } from './trash.js';

export const adminRouter = Router();

adminRouter.use(requireAuth);
adminRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

adminRouter.use('/dashboard', dashboardRouter);
adminRouter.use('/uploads', uploadsRouter);
adminRouter.use('/media', mediaRouter);
adminRouter.use('/events', eventsAdminRouter);
adminRouter.use('/gallery', galleryRouter);
adminRouter.use('/albums', albumsRouter);
adminRouter.use('/homepage', homepageRouter);
adminRouter.use('/impact-cards', impactCardsRouter);
adminRouter.use('/programs', programsRouter);
adminRouter.use('/testimonials', testimonialsRouter);
adminRouter.use('/volunteers', volunteersRouter);
adminRouter.use('/messages', messagesRouter);
adminRouter.use('/settings', settingsRouter);
adminRouter.use('/trash', trashRouter);
adminRouter.use('/users', requireRole('owner'), usersRouter);
