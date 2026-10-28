import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Settings } from '../models/Settings.js';
import { Homepage } from '../models/Homepage.js';
import { Event } from '../models/Event.js';
import { Album, GalleryItem } from '../models/Gallery.js';
import { ImpactCard, Program, Testimonial } from '../models/Content.js';
import { MediaAsset } from '../models/MediaAsset.js';
import * as data from './data.js';

const reset = process.argv.includes('--reset');

async function seedOwner() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    console.warn('[seed] ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping owner account');
    return;
  }
  const email = env.ADMIN_EMAIL.toLowerCase();
  if (await User.exists({ email })) {
    console.log(`[seed] owner ${email} already exists`);
    return;
  }
  await User.create({
    email,
    name: env.ADMIN_NAME,
    role: 'owner',
    active: true,
    passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, 12),
  });
  console.log(`[seed] created owner ${email}`);
}

async function seedContent() {
  const hasContent = await Event.exists({});
  if (hasContent && !reset) {
    console.log('[seed] content already present — run with --reset to replace it');
    return;
  }
  if (reset) {
    await Promise.all([
      Settings.deleteMany({}),
      Homepage.deleteMany({}),
      Event.deleteMany({}),
      Album.deleteMany({}),
      GalleryItem.deleteMany({}),
      ImpactCard.deleteMany({}),
      Program.deleteMany({}),
      Testimonial.deleteMany({}),
      MediaAsset.deleteMany({ provider: 'external' }),
    ]);
  }

  await Settings.create(data.settings);
  await Homepage.create(data.homepage);

  const events = await Event.insertMany(data.events);
  const programs = await Program.insertMany(data.programs.map((p, i) => ({ ...p, order: i })));
  await ImpactCard.insertMany(data.impactCards.map((c, i) => ({ ...c, order: i, eventRef: events[1]._id })));
  await Testimonial.insertMany(data.testimonials.map((t, i) => ({ ...t, order: i, published: true })));

  const albums = await Album.insertMany(
    events.map((e, i) => ({ title: e.title, slug: e.slug, cover: e.coverImage?.url, eventRef: e._id, order: i })),
  );

  const programForEvent = [0, 2, 3];
  await GalleryItem.insertMany(
    data.galleryPhotos.map((p, i) => ({
      image: p.url,
      caption: { en: p.en, es: p.es },
      alt: { en: p.en, es: p.es },
      eventRef: p.event != null ? events[p.event]._id : undefined,
      albumRef: p.event != null ? albums[p.event]._id : undefined,
      programRef: p.event != null ? programs[programForEvent[p.event]]._id : undefined,
      order: i,
      homepageSlot: i < 4 ? i + 1 : null,
    })),
  );

  // Register the placeholder photos in the Media Library so editors can reuse them.
  const urls = new Set<string>(Object.values(data.PHOTOS));
  await MediaAsset.insertMany(
    [...urls].map((url) => ({
      url,
      type: 'image',
      provider: 'external',
      width: 1400,
      height: 933,
      orientation: 'horizontal',
      caption: { en: 'Sample photo', es: 'Foto de ejemplo' },
      alt: { en: 'Sample photo', es: 'Foto de ejemplo' },
      tags: ['sample'],
    })),
  );

  console.log(`[seed] created ${events.length} events, ${programs.length} programs and gallery content`);
}

async function main() {
  await connectDb();
  await seedOwner();
  await seedContent();
  await mongoose.disconnect();
  console.log('[seed] done');
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
