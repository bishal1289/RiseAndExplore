import type { Model } from 'mongoose';
import { cloudinary } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { logActivity } from '../lib/activity.js';
import { MediaAsset } from '../models/MediaAsset.js';
import { Event } from '../models/Event.js';
import { Album, GalleryItem } from '../models/Gallery.js';
import { ImpactCard, Program, Testimonial } from '../models/Content.js';
import { ContactMessage, Volunteer } from '../models/Inbox.js';

const TRASH_DAYS = 30;

/** Removes the actual file from Cloudinary. */
export async function destroyMedia(asset: { publicId?: string | null; type?: string | null }) {
  if (!asset.publicId || !env.cloudinaryEnabled) return;
  try {
    await cloudinary.uploader.destroy(asset.publicId, {
      resource_type: asset.type === 'video' ? 'video' : 'image',
      invalidate: true,
    });
  } catch (err) {
    console.error('[trash] cloudinary destroy failed', asset.publicId, err);
  }
}

/** Permanently deletes anything that has been in the Trash for more than 30 days. */
export async function purgeTrash() {
  const cutoff = new Date(Date.now() - TRASH_DAYS * 86400000);
  const expiredMedia = await MediaAsset.find({ deletedAt: { $ne: null, $lt: cutoff } });
  for (const asset of expiredMedia) {
    await destroyMedia(asset);
    await asset.deleteOne();
  }
  const models: Model<any>[] = [Event, GalleryItem, Album, Program, Testimonial, ImpactCard, Volunteer, ContactMessage];
  let removed = expiredMedia.length;
  for (const m of models) {
    const r = await m.deleteMany({ deletedAt: { $ne: null, $lt: cutoff } });
    removed += r.deletedCount ?? 0;
  }
  if (removed) await logActivity(null, 'purged', 'Trash', '', `${removed} items older than ${TRASH_DAYS} days`);
}

export function scheduleTrashPurge() {
  const run = () => purgeTrash().catch((err) => console.error('[trash] purge failed', err));
  setTimeout(run, 60_000);
  setInterval(run, 12 * 60 * 60 * 1000);
}
