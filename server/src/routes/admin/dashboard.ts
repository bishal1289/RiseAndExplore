import { Router } from 'express';
import { asyncHandler } from '../../lib/http.js';
import { Event } from '../../models/Event.js';
import { MediaAsset } from '../../models/MediaAsset.js';
import { ContactMessage, Volunteer } from '../../models/Inbox.js';
import { ActivityLog, Donation } from '../../models/Logs.js';
import { cloudinary } from '../../config/cloudinary.js';
import { env } from '../../config/env.js';

export const dashboardRouter = Router();

dashboardRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const monthStart = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
    const [upcomingEvents, mediaThisMonth, newVolunteers, unreadMessages, activity, donations] = await Promise.all([
      Event.find({ deletedAt: null, date: { $gte: startOfToday } })
        .sort({ date: 1 })
        .limit(5)
        .select('title date status locationName featured')
        .lean(),
      MediaAsset.aggregate([
        { $match: { deletedAt: null, createdAt: { $gte: monthStart } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      Volunteer.countDocuments({ deletedAt: null, status: 'new' }),
      ContactMessage.countDocuments({ deletedAt: null, status: 'new' }),
      ActivityLog.find().sort({ createdAt: -1 }).limit(15).lean(),
      Donation.aggregate([
        { $match: { receivedAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
    ]);
    const media = Object.fromEntries(mediaThisMonth.map((m) => [m._id, m.count])) as Record<string, number>;
    res.json({
      upcomingEvents,
      upcomingCount: await Event.countDocuments({ deletedAt: null, date: { $gte: startOfToday } }),
      photosThisMonth: media.image ?? 0,
      videosThisMonth: (media.video ?? 0) + (media.embed ?? 0),
      newVolunteers,
      unreadMessages,
      activity,
      donationsThisMonth: donations[0] ?? { total: 0, count: 0 },
    });
  }),
);

/** Sidebar badges — polled by the admin layout. */
dashboardRouter.get(
  '/badges',
  asyncHandler(async (_req, res) => {
    const [volunteers, messages] = await Promise.all([
      Volunteer.countDocuments({ deletedAt: null, status: 'new' }),
      ContactMessage.countDocuments({ deletedAt: null, status: 'new' }),
    ]);
    res.json({ volunteers, messages });
  }),
);

dashboardRouter.get(
  '/storage',
  asyncHandler(async (_req, res) => {
    if (!env.cloudinaryEnabled) return res.json({ available: false });
    try {
      const usage: any = await cloudinary.api.usage();
      res.json({
        available: true,
        usedBytes: usage.storage?.usage ?? 0,
        creditsUsed: usage.credits?.usage ?? null,
        creditsLimit: usage.credits?.limit ?? null,
        usedPercent: usage.credits?.used_percent ?? null,
        plan: usage.plan ?? '',
      });
    } catch {
      res.json({ available: false });
    }
  }),
);
