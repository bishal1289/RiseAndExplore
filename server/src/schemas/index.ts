import { z } from 'zod';

const str = (max = 5000) => z.string().trim().max(max).default('');
export const loc = (max = 5000) =>
  z.object({ en: str(max), es: str(max) }).default({ en: '', es: '' });
const locRequired = (max = 500) =>
  z.object({ en: z.string().trim().min(1, 'English text is required').max(max), es: str(max) });
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'invalid id');
const optionalId = objectId.optional().nullable().or(z.literal('').transform(() => null));
const url = z.string().trim().max(2000).default('');

export const imageRefSchema = z
  .object({
    url,
    media: optionalId,
    alt: loc(300),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .default({ url: '', alt: { en: '', es: '' } });

// ─── Public forms ───────────────────────────────────
export const volunteerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: str(40),
  interests: z.array(z.string().max(60)).max(10).default([]),
  availability: str(200),
  message: str(3000),
  eventRef: optionalId,
  language: z.enum(['en', 'es']).default('en'),
  // Honeypot: real users never fill this.
  website: z.string().max(0).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: str(40),
  subject: str(200),
  message: z.string().trim().min(5).max(5000),
  language: z.enum(['en', 'es']).default('en'),
  website: z.string().max(0).optional(),
});

// ─── Auth ───────────────────────────────────────────
const password = z.string().min(8, 'Use at least 8 characters').max(200);
export const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });
export const forgotSchema = z.object({ email: z.string().trim().email() });
export const resetSchema = z.object({ token: z.string().min(10), password, name: str(120).optional() });
export const inviteSchema = z.object({
  email: z.string().trim().email(),
  name: str(120),
  role: z.enum(['owner', 'editor']).default('editor'),
});
export const userUpdateSchema = z.object({
  role: z.enum(['owner', 'editor']).optional(),
  active: z.boolean().optional(),
  name: str(120).optional(),
});

// ─── Content ────────────────────────────────────────
const videoItem = z.object({
  _id: optionalId,
  media: optionalId,
  kind: z.enum(['file', 'embed']).default('file'),
  url: z.string().trim().min(1).max(2000),
  caption: loc(300),
  duration: z.number().min(0).default(0),
  poster: url,
  orientation: z.enum(['vertical', 'horizontal', 'square']).default('horizontal'),
  isMain: z.boolean().default(false),
});

const photoItem = z.object({
  _id: optionalId,
  media: optionalId,
  url: z.string().trim().min(1).max(2000),
  caption: loc(300),
  alt: loc(300),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const eventSchema = z.object({
  title: locRequired(200),
  slug: str(120),
  date: z.coerce.date(),
  startTime: str(10),
  endTime: str(10),
  locationName: str(200),
  address: str(300),
  city: str(120),
  eventType: z.enum(['community-meal', 'pantry-fill', 'clothing-drive', 'other']).default('other'),
  summary: loc(600),
  body: loc(50000),
  coverImage: imageRefSchema,
  gallery: z.array(photoItem).max(500).default([]),
  videos: z.array(videoItem).max(50).default([]),
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'scheduled']).default('draft'),
  publishAt: z.coerce.date().optional().nullable(),
  volunteerSignup: z
    .object({ enabled: z.boolean().default(false), capacity: z.number().int().min(0).default(0) })
    .default({ enabled: false, capacity: 0 }),
});

export const programSchema = z.object({
  title: locRequired(120),
  slug: str(120),
  number: z.number().int().min(1).max(99).default(1),
  shortText: loc(400),
  body: loc(20000),
  image: url,
  imageAlt: loc(300),
  order: z.number().default(0),
});

export const testimonialSchema = z.object({
  quote: locRequired(1000),
  name: z.string().trim().min(1).max(120),
  organization: loc(200),
  videoUrl: url,
  poster: url,
  duration: z.number().min(0).default(0),
  videoCaption: loc(200),
  published: z.boolean().default(true),
  order: z.number().default(0),
});

export const impactCardSchema = z.object({
  title: locRequired(120),
  description: loc(400),
  image: url,
  imageAlt: loc(300),
  dateLabel: loc(60),
  eventRef: optionalId,
  order: z.number().default(0),
});

export const albumSchema = z.object({
  title: locRequired(120),
  slug: str(120),
  cover: url,
  eventRef: optionalId,
  order: z.number().default(0),
});

export const galleryItemSchema = z.object({
  media: optionalId,
  image: z.string().trim().min(1).max(2000),
  width: z.number().default(0),
  height: z.number().default(0),
  caption: loc(300),
  alt: loc(300),
  eventRef: optionalId,
  programRef: optionalId,
  albumRef: optionalId,
  order: z.number().default(0),
  homepageSlot: z.number().int().min(1).max(4).nullable().default(null),
});

export const galleryBulkSchema = z.object({
  mediaIds: z.array(objectId).min(1).max(200),
  eventRef: optionalId,
  albumRef: optionalId,
  programRef: optionalId,
});

export const reorderSchema = z.object({ ids: z.array(objectId).max(1000) });
export const homepageSlotsSchema = z.object({ ids: z.array(objectId).max(4) });

export const mediaCreateSchema = z.object({
  publicId: str(300),
  url: z.string().trim().min(1).max(2000),
  type: z.enum(['image', 'video', 'embed']),
  provider: z.enum(['cloudinary', 'youtube', 'vimeo', 'external']).default('cloudinary'),
  width: z.number().default(0),
  height: z.number().default(0),
  duration: z.number().default(0),
  posterUrl: url,
  bytes: z.number().default(0),
  format: str(20),
  folder: str(100),
  caption: loc(300),
  alt: loc(300),
  tags: z.array(z.string().trim().max(40)).max(30).default([]),
  eventRef: optionalId,
  processing: z.boolean().default(false),
});

export const mediaEmbedSchema = z.object({
  url: z.string().trim().url(),
  caption: loc(300),
  eventRef: optionalId,
});

export const mediaUpdateSchema = z.object({
  caption: loc(300).optional(),
  alt: loc(300).optional(),
  tags: z.array(z.string().trim().max(40)).max(30).optional(),
  eventRef: optionalId,
  // Fields set when the file itself is replaced.
  publicId: z.string().optional(),
  url: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  duration: z.number().optional(),
  posterUrl: z.string().optional(),
  bytes: z.number().optional(),
  format: z.string().optional(),
});

export const mediaBulkSchema = z.object({
  ids: z.array(objectId).min(1).max(200),
  action: z.enum(['tag', 'delete', 'addToEvent', 'addToGallery']),
  tags: z.array(z.string().trim().max(40)).optional(),
  eventId: optionalId,
  albumId: optionalId,
});

export const signSchema = z.object({
  folder: z.string().default('rise/media'),
  resourceType: z.enum(['image', 'video']).default('image'),
});

const sectionKey = z.enum(['hero', 'summer', 'impact', 'testimonials', 'whatWeDo', 'community', 'cta']);
const videoBlock = z
  .object({ url, poster: url, duration: z.number().min(0).default(0), label: loc(120) })
  .default({ url: '', poster: '', duration: 0, label: { en: '', es: '' } });

export const homepageSchema = z.object({
  sections: z.array(z.object({ key: sectionKey, visible: z.boolean() })).max(7),
  hero: z.object({
    headline: loc(120),
    text: loc(600),
    backgroundVideo: z.object({ url, poster: url }),
    watchVideo: videoBlock,
  }),
  donation: z
    .object({
      amounts: z.array(z.number().int().min(1).max(100000)).length(4),
      defaultAmount: z.number().int().min(1),
    })
    .refine((d) => d.amounts.includes(d.defaultAmount), {
      message: 'The default amount must be one of the four buttons',
      path: ['defaultAmount'],
    }),
  summer: z.object({ chip: loc(60), heading: loc(200), text: loc(600), video: videoBlock }),
  impact: z.object({ heading: loc(120), linkLabel: loc(120), linkUrl: url }),
  whatWeDo: z.object({ heading: loc(120) }),
  community: z.object({ heading: loc(120), buttonLabel: loc(60) }),
  cta: z.object({ heading: loc(200) }),
});

export const settingsSchema = z.object({
  orgName: str(200),
  phone: str(40),
  email: z.string().trim().email().or(z.literal('')).default(''),
  address: str(200),
  city: str(100),
  state: str(40),
  zip: str(20),
  mapEmbedUrl: url,
  social: z.object({
    facebook: url,
    instagram: url,
    tiktok: url,
    youtube: url,
    linkedin: url,
  }),
  zeffyFormUrl: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https:\/\/(www\.)?zeffy\.com\//.test(v), 'Must be a zeffy.com link')
    .default(''),
  givebutter: z.object({
    accountId: str(100),
    shopWidgetId: str(100),
    storeUrl: url,
    featuredProducts: z
      .array(z.object({ title: loc(120), price: str(20), image: url, url }))
      .max(6)
      .default([]),
  }),
  notificationEmail: z.string().trim().email().or(z.literal('')).default(''),
  footerText: loc(600),
});

export const inboxUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'archived']).optional(),
  notes: z.string().max(5000).optional(),
});
