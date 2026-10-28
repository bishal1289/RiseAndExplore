import { Router } from 'express';
import { asyncHandler, notFound } from '../../lib/http.js';
import { validate } from '../../middleware/validate.js';
import { eventSchema } from '../../schemas/index.js';
import { Event, mapsUrlFor } from '../../models/Event.js';
import { uniqueSlug } from '../../lib/slug.js';
import { cleanLocalizedHtml } from '../../lib/sanitize.js';
import { logActivity } from '../../lib/activity.js';

export const eventsAdminRouter = Router();

const MAX_FEATURED = 2;

/**
 * Keeps at most two featured events. When a third is featured, the one that has
 * been featured the longest is un-featured and its title returned as a notice.
 */
async function enforceFeaturedLimit(keepId: string) {
  const featured = await Event.find({ featured: true, deletedAt: null }).sort({ featuredAt: 1 }).select('title featuredAt');
  const overflow = featured.length - MAX_FEATURED;
  if (overflow <= 0) return [];
  const toUnfeature = featured.filter((e) => e.id !== keepId).slice(0, overflow);
  await Event.updateMany({ _id: { $in: toUnfeature.map((e) => e._id) } }, { featured: false, $unset: { featuredAt: 1 } });
  return toUnfeature.map((e) => e.title?.en ?? '');
}

function prepare(body: any) {
  const videos = body.videos as any[];
  // Exactly one main video when any exist.
  if (videos.length && !videos.some((v) => v.isMain)) videos[0].isMain = true;
  let mainSeen = false;
  for (const v of videos) {
    if (v.isMain && mainSeen) v.isMain = false;
    if (v.isMain) mainSeen = true;
  }
  return {
    ...body,
    body: cleanLocalizedHtml(body.body),
    publishAt: body.status === 'scheduled' ? body.publishAt : null,
  };
}

eventsAdminRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = { deletedAt: null };
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const tab = req.query.tab;
    if (tab === 'drafts') filter.status = { $in: ['draft', 'scheduled'] };
    if (tab === 'upcoming') Object.assign(filter, { status: { $ne: 'draft' }, date: { $gte: startOfToday } });
    if (tab === 'past') Object.assign(filter, { status: { $ne: 'draft' }, date: { $lt: startOfToday } });
    const year = Number(req.query.year);
    if (year) {
      const range = { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) };
      filter.date = filter.date ? { ...(filter.date as object), ...range } : range;
    }
    if (typeof req.query.q === 'string' && req.query.q.trim()) {
      const rx = new RegExp(req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ 'title.en': rx }, { 'title.es': rx }, { locationName: rx }, { city: rx }];
    }
    const events = await Event.find(filter)
      .sort({ date: tab === 'past' ? -1 : 1 })
      .select('title slug date locationName city status publishAt featured coverImage eventType gallery')
      .lean();
    res.json(events.map(({ gallery, ...e }) => ({ ...e, photoCount: gallery?.length ?? 0 })));
  }),
);

eventsAdminRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await Event.findOne({ _id: req.params.id, deletedAt: null }).lean();
    if (!event) throw notFound('Event');
    res.json({ ...event, mapsUrl: mapsUrlFor(event) });
  }),
);

eventsAdminRouter.post(
  '/',
  validate(eventSchema),
  asyncHandler(async (req, res) => {
    const data = prepare(req.body);
    data.slug = await uniqueSlug(Event, data.slug || data.title.en);
    if (data.featured) data.featuredAt = new Date();
    const event = await Event.create({ ...data, createdBy: req.user?._id });
    const unfeatured = data.featured ? await enforceFeaturedLimit(event.id) : [];
    await logActivity(req, event.status === 'published' ? 'published' : 'created', 'Event', event._id, event.title?.en);
    res.status(201).json({ event, unfeatured });
  }),
);

eventsAdminRouter.put(
  '/:id',
  validate(eventSchema),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const existing = await Event.findOne({ _id: id, deletedAt: null });
    if (!existing) throw notFound('Event');
    const data = prepare(req.body);
    data.slug = await uniqueSlug(Event, data.slug || data.title.en, id);
    if (data.featured && !existing.featured) data.featuredAt = new Date();
    if (!data.featured) data.featuredAt = undefined;
    const becamePublished = existing.status !== 'published' && data.status === 'published';
    existing.set(data);
    await existing.save();
    const unfeatured = data.featured ? await enforceFeaturedLimit(existing.id) : [];
    await logActivity(req, becamePublished ? 'published' : 'updated', 'Event', existing._id, existing.title?.en);
    res.json({ event: existing, unfeatured });
  }),
);

eventsAdminRouter.post(
  '/:id/duplicate',
  asyncHandler(async (req, res) => {
    const src = await Event.findOne({ _id: req.params.id, deletedAt: null }).lean();
    if (!src) throw notFound('Event');
    const { _id, createdAt: _c, updatedAt: _u, ...rest } = src as any;
    const title = { en: `${src.title?.en ?? 'Event'} (copy)`, es: src.title?.es ? `${src.title.es} (copia)` : '' };
    const copy = await Event.create({
      ...rest,
      title,
      slug: await uniqueSlug(Event, title.en),
      status: 'draft',
      featured: false,
      featuredAt: undefined,
      publishAt: undefined,
      gallery: [],
      createdBy: req.user?._id,
    });
    await logActivity(req, 'created', 'Event', copy._id, `${title.en} (duplicated)`);
    res.status(201).json(copy);
  }),
);

eventsAdminRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date(), featured: false },
    );
    if (!event) throw notFound('Event');
    await logActivity(req, 'deleted', 'Event', event._id, event.title?.en);
    res.json({ ok: true });
  }),
);
