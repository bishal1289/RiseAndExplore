import { Router } from 'express';
import type { Model } from 'mongoose';
import { asyncHandler, HttpError, notFound } from '../../lib/http.js';
import { Event } from '../../models/Event.js';
import { MediaAsset } from '../../models/MediaAsset.js';
import { Album, GalleryItem } from '../../models/Gallery.js';
import { ImpactCard, Program, Testimonial } from '../../models/Content.js';
import { ContactMessage, Volunteer } from '../../models/Inbox.js';
import { logActivity } from '../../lib/activity.js';
import { destroyMedia } from '../../jobs/trash.js';

export const TRASH_DAYS = 30;

export const TRASHABLE: Record<string, { model: Model<any>; label: (d: any) => string; name: string }> = {
  event: { model: Event, name: 'Event', label: (d) => d.title?.en },
  media: { model: MediaAsset, name: 'Photo/video', label: (d) => d.caption?.en || `${d.type} ${d.format ?? ''}` },
  gallery: { model: GalleryItem, name: 'Gallery photo', label: (d) => d.caption?.en || 'Photo' },
  album: { model: Album, name: 'Album', label: (d) => d.title?.en },
  program: { model: Program, name: 'Program', label: (d) => d.title?.en },
  testimonial: { model: Testimonial, name: 'Testimonial', label: (d) => d.name },
  impact: { model: ImpactCard, name: 'Homepage card', label: (d) => d.title?.en },
  volunteer: { model: Volunteer, name: 'Volunteer', label: (d) => d.name },
  message: { model: ContactMessage, name: 'Message', label: (d) => d.name },
};

export const trashRouter = Router();

trashRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const lists = await Promise.all(
      Object.entries(TRASHABLE).map(async ([type, cfg]) => {
        const docs = await cfg.model.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 }).lean();
        return docs.map((d: any) => ({
          type,
          typeName: cfg.name,
          id: String(d._id),
          label: cfg.label(d) || cfg.name,
          thumb: d.coverImage?.url || d.image || d.posterUrl || (d.type === 'image' ? d.url : '') || '',
          deletedAt: d.deletedAt,
          purgeAt: new Date(new Date(d.deletedAt).getTime() + TRASH_DAYS * 86400000),
        }));
      }),
    );
    res.json(lists.flat().sort((a, b) => +new Date(b.deletedAt) - +new Date(a.deletedAt)));
  }),
);

const cfgFor = (type: string) => {
  const cfg = TRASHABLE[type];
  if (!cfg) throw new HttpError(400, 'Unknown item type');
  return cfg;
};

trashRouter.post(
  '/:type/:id/restore',
  asyncHandler(async (req, res) => {
    const cfg = cfgFor(String(req.params.type));
    const doc = await cfg.model.findOneAndUpdate(
      { _id: req.params.id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true },
    );
    if (!doc) throw notFound(cfg.name);
    await logActivity(req, 'restored', cfg.name, doc._id, cfg.label(doc));
    res.json({ ok: true });
  }),
);

trashRouter.delete(
  '/:type/:id',
  asyncHandler(async (req, res) => {
    const cfg = cfgFor(String(req.params.type));
    const doc = await cfg.model.findOne({ _id: req.params.id, deletedAt: { $ne: null } });
    if (!doc) throw notFound(cfg.name);
    if (req.params.type === 'media') await destroyMedia(doc);
    await doc.deleteOne();
    await logActivity(req, 'purged', cfg.name, doc._id, cfg.label(doc));
    res.json({ ok: true });
  }),
);
