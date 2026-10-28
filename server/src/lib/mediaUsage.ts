import { Event } from '../models/Event.js';
import { Album, GalleryItem } from '../models/Gallery.js';
import { ImpactCard, Program, Testimonial } from '../models/Content.js';
import { Homepage } from '../models/Homepage.js';

export interface MediaUsage {
  type: string;
  id: string;
  label: string;
}

/** Lists every place a media URL is used so editors are warned before deleting it. */
export async function findMediaUsage(url: string, posterUrl = ''): Promise<MediaUsage[]> {
  const urls = [url, posterUrl].filter(Boolean);
  if (!urls.length) return [];
  const anyUrl = { $in: urls };
  const [events, gallery, albums, impact, programs, testimonials, homepage] = await Promise.all([
    Event.find({
      deletedAt: null,
      $or: [{ 'coverImage.url': anyUrl }, { 'gallery.url': anyUrl }, { 'videos.url': anyUrl }, { 'videos.poster': anyUrl }],
    })
      .select('title')
      .lean(),
    GalleryItem.countDocuments({ deletedAt: null, image: anyUrl }),
    Album.find({ deletedAt: null, cover: anyUrl }).select('title').lean(),
    ImpactCard.find({ deletedAt: null, image: anyUrl }).select('title').lean(),
    Program.find({ deletedAt: null, image: anyUrl }).select('title').lean(),
    Testimonial.find({ deletedAt: null, $or: [{ videoUrl: anyUrl }, { poster: anyUrl }] }).select('name').lean(),
    Homepage.findOne({
      $or: [
        { 'hero.backgroundVideo.url': anyUrl },
        { 'hero.backgroundVideo.poster': anyUrl },
        { 'hero.watchVideo.url': anyUrl },
        { 'hero.watchVideo.poster': anyUrl },
        { 'summer.video.url': anyUrl },
        { 'summer.video.poster': anyUrl },
      ],
    })
      .select('_id')
      .lean(),
  ]);
  const usage: MediaUsage[] = [
    ...events.map((e) => ({ type: 'Event', id: String(e._id), label: e.title?.en ?? '' })),
    ...albums.map((a) => ({ type: 'Album', id: String(a._id), label: a.title?.en ?? '' })),
    ...impact.map((c) => ({ type: 'Homepage card', id: String(c._id), label: c.title?.en ?? '' })),
    ...programs.map((p) => ({ type: 'Program', id: String(p._id), label: p.title?.en ?? '' })),
    ...testimonials.map((t) => ({ type: 'Testimonial', id: String(t._id), label: t.name })),
  ];
  if (gallery) usage.push({ type: 'Gallery', id: '', label: `${gallery} gallery photo${gallery > 1 ? 's' : ''}` });
  if (homepage) usage.push({ type: 'Homepage', id: '', label: 'Homepage video' });
  return usage;
}
