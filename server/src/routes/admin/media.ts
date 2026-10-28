import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, HttpError, notFound } from '../../lib/http.js';
import { validate } from '../../middleware/validate.js';
import {
  mediaBulkSchema,
  mediaCreateSchema,
  mediaEmbedSchema,
  mediaUpdateSchema,
  signSchema,
} from '../../schemas/index.js';
import { MediaAsset, orientationOf } from '../../models/MediaAsset.js';
import { Event } from '../../models/Event.js';
import { GalleryItem } from '../../models/Gallery.js';
import { cloudinary, UPLOAD_FOLDERS } from '../../config/cloudinary.js';
import { env } from '../../config/env.js';
import { findMediaUsage } from '../../lib/mediaUsage.js';
import { logActivity } from '../../lib/activity.js';

export const uploadsRouter = Router();
export const mediaRouter = Router();

const requireCloudinary = () => {
  if (!env.cloudinaryEnabled) {
    throw new HttpError(503, 'Uploads are not set up yet. Add the Cloudinary keys to the server settings.');
  }
};

/** Cloudinary video poster: first frame as JPG. */
export const videoPoster = (publicId: string) =>
  cloudinary.url(publicId, { resource_type: 'video', format: 'jpg', transformation: [{ start_offset: '0' }] });

/**
 * Returns signed params so the browser can upload straight to Cloudinary.
 * Videos get an async eager MP4 transcode and a webhook to mark them ready.
 */
uploadsRouter.post(
  '/sign',
  validate(signSchema),
  asyncHandler(async (req, res) => {
    requireCloudinary();
    const folder = (UPLOAD_FOLDERS as readonly string[]).includes(req.body.folder) ? req.body.folder : 'rise/media';
    const timestamp = Math.round(Date.now() / 1000);
    const params: Record<string, string | number> = { folder, timestamp };
    if (req.body.resourceType === 'video') {
      params.eager = 'f_mp4,vc_auto,q_auto';
      params.eager_async = 'true';
      params.eager_notification_url = `${env.SERVER_URL}/api/webhooks/cloudinary`;
    }
    const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET!);
    res.json({
      ...params,
      signature,
      apiKey: env.CLOUDINARY_API_KEY,
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${req.body.resourceType}/upload`,
    });
  }),
);

/** Small server-side upload fallback (e.g. logos, partner images) via Multer. */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
uploadsRouter.post(
  '/file',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    requireCloudinary();
    if (!req.file) throw new HttpError(400, 'No file received');
    if (!/^image\//.test(req.file.mimetype)) throw new HttpError(400, 'Only images can be uploaded here');
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: 'rise/media', resource_type: 'image' }, (err, r) => (err ? reject(err) : resolve(r)))
        .end(req.file!.buffer);
    });
    const asset = await MediaAsset.create({
      publicId: result.public_id,
      url: result.secure_url,
      type: 'image',
      width: result.width,
      height: result.height,
      orientation: orientationOf(result.width, result.height),
      bytes: result.bytes,
      format: result.format,
      folder: 'rise/media',
      uploadedBy: req.user?._id,
    });
    await logActivity(req, 'uploaded', 'Media', asset._id, req.file.originalname);
    res.status(201).json(asset);
  }),
);

mediaRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = { deletedAt: null };
    const { type, event, q, unused, sort } = req.query as Record<string, string | undefined>;
    if (type === 'image' || type === 'video') filter.type = type === 'video' ? { $in: ['video', 'embed'] } : 'image';
    if (event) filter.eventRef = event;
    if (q?.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ 'caption.en': rx }, { 'caption.es': rx }, { tags: rx }];
    }
    let items = await MediaAsset.find(filter)
      .sort({ createdAt: sort === 'oldest' ? 1 : -1 })
      .limit(Math.min(Number(req.query.limit) || 500, 1000))
      .lean();
    if (unused === 'true') {
      const usage = await Promise.all(items.map((m) => findMediaUsage(m.url, m.posterUrl)));
      items = items.filter((_m, i) => usage[i].length === 0);
    }
    res.json(items);
  }),
);

mediaRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const asset = await MediaAsset.findOne({ _id: req.params.id, deletedAt: null }).lean();
    if (!asset) throw notFound('Photo or video');
    res.json({ ...asset, usage: await findMediaUsage(asset.url, asset.posterUrl) });
  }),
);

/** Saves the record after the browser finished uploading to Cloudinary. */
mediaRouter.post(
  '/',
  validate(mediaCreateSchema),
  asyncHandler(async (req, res) => {
    const { processing, ...b } = req.body;
    const posterUrl = b.type === 'video' && b.publicId ? videoPoster(b.publicId) : b.posterUrl;
    const asset = await MediaAsset.create({
      ...b,
      posterUrl,
      orientation: orientationOf(b.width, b.height),
      status: b.type === 'video' && processing ? 'processing' : 'ready',
      uploadedBy: req.user?._id,
    });
    await logActivity(req, 'uploaded', 'Media', asset._id, b.caption?.en || b.format || b.type);
    res.status(201).json(asset);
  }),
);

/** YouTube / Vimeo link instead of a file. */
mediaRouter.post(
  '/embed',
  validate(mediaEmbedSchema),
  asyncHandler(async (req, res) => {
    const url: string = req.body.url;
    let provider: 'youtube' | 'vimeo';
    let posterUrl = '';
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    let width = 1280;
    let height = 720;
    if (yt) {
      provider = 'youtube';
      posterUrl = `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`;
      if (url.includes('/shorts/')) [width, height] = [720, 1280];
    } else if (vimeo) {
      provider = 'vimeo';
      try {
        const r = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`);
        if (r.ok) {
          const data = (await r.json()) as { thumbnail_url?: string; width?: number; height?: number };
          posterUrl = data.thumbnail_url ?? '';
          width = data.width ?? width;
          height = data.height ?? height;
        }
      } catch {
        /* thumbnail is optional */
      }
    } else {
      throw new HttpError(400, 'Please paste a YouTube or Vimeo link');
    }
    const asset = await MediaAsset.create({
      url,
      type: 'embed',
      provider,
      posterUrl,
      width,
      height,
      orientation: orientationOf(width, height),
      caption: req.body.caption,
      eventRef: req.body.eventRef,
      uploadedBy: req.user?._id,
    });
    await logActivity(req, 'uploaded', 'Media', asset._id, `${provider} link`);
    res.status(201).json(asset);
  }),
);

mediaRouter.put(
  '/:id',
  validate(mediaUpdateSchema),
  asyncHandler(async (req, res) => {
    const asset = await MediaAsset.findOne({ _id: req.params.id, deletedAt: null });
    if (!asset) throw notFound('Photo or video');
    const oldUrl = asset.url;
    const oldPublicId = asset.publicId;
    const b = req.body;
    asset.set(b);
    if (b.width && b.height) asset.orientation = orientationOf(b.width, b.height);
    if (b.publicId && asset.type === 'video') asset.posterUrl = videoPoster(b.publicId);
    await asset.save();
    // A replaced file: point all content at the new URL and drop the old file.
    if (b.url && b.url !== oldUrl) {
      await replaceUrlEverywhere(oldUrl, b.url);
      if (oldPublicId && env.cloudinaryEnabled) {
        cloudinary.uploader
          .destroy(oldPublicId, { resource_type: asset.type === 'video' ? 'video' : 'image' })
          .catch(() => undefined);
      }
    }
    await logActivity(req, 'updated', 'Media', asset._id, asset.caption?.en || asset.format);
    res.json(asset);
  }),
);

mediaRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const asset = await MediaAsset.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { deletedAt: new Date() },
    );
    if (!asset) throw notFound('Photo or video');
    await logActivity(req, 'deleted', 'Media', asset._id, asset.caption?.en || asset.format);
    res.json({ ok: true });
  }),
);

mediaRouter.post(
  '/bulk',
  validate(mediaBulkSchema),
  asyncHandler(async (req, res) => {
    const { ids, action, tags, eventId, albumId } = req.body;
    const assets = await MediaAsset.find({ _id: { $in: ids }, deletedAt: null });
    if (action === 'tag') {
      await MediaAsset.updateMany({ _id: { $in: ids } }, { $addToSet: { tags: { $each: tags ?? [] } } });
    }
    if (action === 'delete') {
      await MediaAsset.updateMany({ _id: { $in: ids } }, { deletedAt: new Date() });
      await logActivity(req, 'deleted', 'Media', '', `${assets.length} items`);
    }
    if (action === 'addToEvent') {
      const event = await Event.findOne({ _id: eventId, deletedAt: null });
      if (!event) throw notFound('Event');
      const existing = new Set([...event.gallery.map((g) => g.url), ...event.videos.map((v) => v.url)]);
      for (const a of assets) {
        if (existing.has(a.url)) continue;
        if (a.type === 'image') {
          event.gallery.push({ url: a.url, media: a._id, alt: a.alt, caption: a.caption, width: a.width, height: a.height });
        } else {
          event.videos.push({
            url: a.url,
            media: a._id,
            kind: a.type === 'embed' ? 'embed' : 'file',
            caption: a.caption,
            duration: a.duration,
            poster: a.posterUrl,
            orientation: a.orientation,
            isMain: event.videos.length === 0,
          });
        }
      }
      await event.save();
      await MediaAsset.updateMany({ _id: { $in: ids }, eventRef: null }, { eventRef: event._id });
      await logActivity(req, 'updated', 'Event', event._id, `${event.title?.en} (+${assets.length} media)`);
    }
    if (action === 'addToGallery') {
      const images = assets.filter((a) => a.type === 'image');
      const max = await GalleryItem.findOne({ deletedAt: null }).sort({ order: -1 }).select('order').lean();
      let order = (max?.order ?? 0) + 1;
      await GalleryItem.insertMany(
        images.map((a) => ({
          media: a._id,
          image: a.url,
          width: a.width,
          height: a.height,
          caption: a.caption,
          alt: a.alt,
          eventRef: a.eventRef,
          albumRef: albumId || undefined,
          order: order++,
        })),
      );
      await logActivity(req, 'created', 'Gallery', '', `${images.length} photos added`);
    }
    res.json({ ok: true, count: assets.length });
  }),
);

async function replaceUrlEverywhere(oldUrl: string, newUrl: string) {
  await Promise.all([
    Event.updateMany({ 'coverImage.url': oldUrl }, { 'coverImage.url': newUrl }),
    Event.updateMany({ 'gallery.url': oldUrl }, { $set: { 'gallery.$[g].url': newUrl } }, { arrayFilters: [{ 'g.url': oldUrl }] }),
    Event.updateMany({ 'videos.url': oldUrl }, { $set: { 'videos.$[v].url': newUrl } }, { arrayFilters: [{ 'v.url': oldUrl }] }),
    GalleryItem.updateMany({ image: oldUrl }, { image: newUrl }),
  ]);
}
