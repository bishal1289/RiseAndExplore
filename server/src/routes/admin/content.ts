import { Router } from 'express';
import { asyncHandler, notFound } from '../../lib/http.js';
import { validate } from '../../middleware/validate.js';
import {
  albumSchema,
  galleryBulkSchema,
  galleryItemSchema,
  homepageSchema,
  homepageSlotsSchema,
  impactCardSchema,
  inboxUpdateSchema,
  programSchema,
  settingsSchema,
  testimonialSchema,
} from '../../schemas/index.js';
import { crudRouter } from './crud.js';
import { Album, GalleryItem } from '../../models/Gallery.js';
import { ImpactCard, Program, Testimonial } from '../../models/Content.js';
import { ContactMessage, Volunteer } from '../../models/Inbox.js';
import { MediaAsset } from '../../models/MediaAsset.js';
import { getHomepage } from '../../models/Homepage.js';
import { getSettings } from '../../models/Settings.js';
import { cleanLocalizedHtml } from '../../lib/sanitize.js';
import { logActivity } from '../../lib/activity.js';
import { requireRole } from '../../middleware/auth.js';
import type { Model } from 'mongoose';

export const programsRouter = crudRouter({
  model: Program,
  schema: programSchema,
  entity: 'Program',
  label: (d) => d.title?.en,
  sort: { number: 1 },
  slugFrom: 'title',
  prepare: (d) => ({ ...d, body: cleanLocalizedHtml(d.body) }),
});

export const testimonialsRouter = crudRouter({
  model: Testimonial,
  schema: testimonialSchema,
  entity: 'Testimonial',
  label: (d) => d.name,
});

export const impactCardsRouter = crudRouter({
  model: ImpactCard,
  schema: impactCardSchema,
  entity: 'Homepage card',
  label: (d) => d.title?.en,
});

export const albumsRouter = crudRouter({
  model: Album,
  schema: albumSchema,
  entity: 'Album',
  label: (d) => d.title?.en,
  slugFrom: 'title',
});

// ─── Gallery ────────────────────────────────────────
export const galleryRouter = Router();

/** Choose the 4 photos for the homepage "Community in action" row (in order). */
galleryRouter.put(
  '/homepage',
  validate(homepageSlotsSchema),
  asyncHandler(async (req, res) => {
    await GalleryItem.updateMany({ homepageSlot: { $ne: null } }, { homepageSlot: null });
    await GalleryItem.bulkWrite(
      (req.body.ids as string[]).map((id, i) => ({
        updateOne: { filter: { _id: id }, update: { $set: { homepageSlot: i + 1 } } },
      })),
    );
    await logActivity(req, 'updated', 'Homepage', '', 'Community in action photos');
    res.json({ ok: true });
  }),
);

/** Add Media Library photos to the gallery in one go. */
galleryRouter.post(
  '/from-media',
  validate(galleryBulkSchema),
  asyncHandler(async (req, res) => {
    const assets = await MediaAsset.find({ _id: { $in: req.body.mediaIds }, type: 'image', deletedAt: null }).lean();
    const max = await GalleryItem.findOne({ deletedAt: null }).sort({ order: -1 }).select('order').lean();
    let order = (max?.order ?? 0) + 1;
    const docs = await GalleryItem.insertMany(
      assets.map((a) => ({
        media: a._id,
        image: a.url,
        width: a.width,
        height: a.height,
        caption: a.caption,
        alt: a.alt,
        eventRef: req.body.eventRef ?? a.eventRef,
        albumRef: req.body.albumRef,
        programRef: req.body.programRef,
        order: order++,
      })),
    );
    await logActivity(req, 'created', 'Gallery', '', `${docs.length} photos added`);
    res.status(201).json(docs);
  }),
);

galleryRouter.use(
  crudRouter({
    model: GalleryItem,
    schema: galleryItemSchema,
    entity: 'Gallery photo',
    label: (d) => d.caption?.en || 'Photo',
  }),
);

// ─── Homepage ───────────────────────────────────────
export const homepageRouter = Router();

homepageRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await getHomepage());
  }),
);

homepageRouter.put(
  '/',
  validate(homepageSchema),
  asyncHandler(async (req, res) => {
    const doc = await getHomepage();
    doc.set(req.body);
    await doc.save();
    await logActivity(req, 'updated', 'Homepage', doc._id, 'Homepage');
    res.json(doc);
  }),
);

// ─── Settings (owner only) ──────────────────────────
export const settingsRouter = Router();

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await getSettings());
  }),
);

settingsRouter.put(
  '/',
  requireRole('owner'),
  validate(settingsSchema),
  asyncHandler(async (req, res) => {
    const doc = await getSettings();
    doc.set(req.body);
    await doc.save();
    await logActivity(req, 'updated', 'Settings', doc._id, 'Site settings');
    res.json(doc);
  }),
);

// ─── Volunteers & messages ──────────────────────────
function inboxRouter(model: Model<any>, entity: string) {
  const router = Router();
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const filter: Record<string, unknown> = { deletedAt: null };
      const status = req.query.status;
      if (status === 'new' || status === 'contacted' || status === 'archived') filter.status = status;
      else filter.status = { $ne: 'archived' };
      if (req.query.status === 'all') delete filter.status;
      const query = model.find(filter).sort({ createdAt: -1 }).limit(2000);
      if (entity === 'Volunteer') query.populate('eventRef', 'title slug');
      res.json(await query.lean());
    }),
  );
  router.put(
    '/:id',
    validate(inboxUpdateSchema),
    asyncHandler(async (req, res) => {
      const doc = await model.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, req.body, { new: true });
      if (!doc) throw notFound(entity);
      res.json(doc);
    }),
  );
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = await model.findOneAndUpdate({ _id: req.params.id, deletedAt: null }, { deletedAt: new Date() });
      if (!doc) throw notFound(entity);
      await logActivity(req, 'deleted', entity, doc._id, doc.name);
      res.json({ ok: true });
    }),
  );
  return router;
}

export const volunteersRouter = inboxRouter(Volunteer, 'Volunteer');
export const messagesRouter = inboxRouter(ContactMessage, 'Message');
