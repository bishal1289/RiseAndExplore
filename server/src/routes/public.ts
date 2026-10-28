import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler, notFound } from '../lib/http.js';
import { localize, parseLang } from '../lib/localize.js';
import { notifyAdmin } from '../lib/mailer.js';
import { validate } from '../middleware/validate.js';
import { contactSchema, volunteerSchema } from '../schemas/index.js';
import { Event, mapsUrlFor, publicEventFilter } from '../models/Event.js';
import { Album, GalleryItem } from '../models/Gallery.js';
import { ImpactCard, Program, Testimonial } from '../models/Content.js';
import { ContactMessage, Volunteer } from '../models/Inbox.js';
import { getSettings } from '../models/Settings.js';
import { getHomepage } from '../models/Homepage.js';
import { env } from '../config/env.js';

export const publicRouter = Router();

const formLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

const EVENT_CARD_FIELDS =
  'title slug date startTime endTime locationName address city eventType summary coverImage featured videos';

const withMaps = <T extends { locationName?: string; address?: string; city?: string }>(e: T) => ({
  ...e,
  mapsUrl: mapsUrlFor(e),
});

publicRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  next();
});

publicRouter.get(
  '/settings',
  asyncHandler(async (req, res) => {
    const s = (await getSettings()).toObject();
    const safe = {
      orgName: s.orgName,
      phone: s.phone,
      email: s.email,
      address: s.address,
      city: s.city,
      state: s.state,
      zip: s.zip,
      mapEmbedUrl: s.mapEmbedUrl,
      social: s.social,
      zeffyFormUrl: s.zeffyFormUrl || env.ZEFFY_DONATION_FORM_URL,
      givebutter: s.givebutter,
      footerText: s.footerText,
    };
    res.json(localize(safe, parseLang(req.query.lang)));
  }),
);

/** Everything the home page needs in a single request. */
publicRouter.get(
  '/home',
  asyncHandler(async (req, res) => {
    const lang = parseLang(req.query.lang);
    const [homepage, featuredEvents, impactCards, testimonials, programs, community] = await Promise.all([
      getHomepage().then((h) => h.toObject()),
      Event.find({ ...publicEventFilter(), featured: true }).sort({ date: 1 }).limit(2).select(EVENT_CARD_FIELDS).lean(),
      ImpactCard.find({ deletedAt: null }).sort({ order: 1 }).limit(3).lean(),
      Testimonial.find({ deletedAt: null, published: true }).sort({ order: 1 }).lean(),
      Program.find({ deletedAt: null }).sort({ number: 1 }).lean(),
      GalleryItem.find({ deletedAt: null, homepageSlot: { $ne: null } }).sort({ homepageSlot: 1 }).limit(4).lean(),
    ]);
    // Fall back to the latest 4 gallery photos when none were picked.
    const communityItems =
      community.length > 0
        ? community
        : await GalleryItem.find({ deletedAt: null }).sort({ createdAt: -1 }).limit(4).lean();
    res.json(
      localize(
        {
          homepage,
          featuredEvents: featuredEvents.map(withMaps),
          impactCards,
          testimonials,
          programs,
          community: communityItems,
        },
        lang,
      ),
    );
  }),
);

publicRouter.get(
  '/events',
  asyncHandler(async (req, res) => {
    const lang = parseLang(req.query.lang);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const filter: Record<string, unknown> = publicEventFilter();
    if (req.query.when === 'upcoming') filter.date = { $gte: startOfToday };
    if (req.query.when === 'past') filter.date = { $lt: startOfToday };
    if (req.query.featured === 'true') filter.featured = true;
    const events = await Event.find(filter)
      .sort({ date: req.query.when === 'past' ? -1 : 1 })
      .limit(Math.min(Number(req.query.limit) || 100, 200))
      .select(EVENT_CARD_FIELDS)
      .lean();
    res.json(localize(events.map(withMaps), lang));
  }),
);

publicRouter.get(
  '/events/:slug',
  asyncHandler(async (req, res) => {
    const event = await Event.findOne({ ...publicEventFilter(), slug: req.params.slug }).lean();
    if (!event) throw notFound('Event');
    let spotsLeft: number | null = null;
    if (event.volunteerSignup?.enabled && event.volunteerSignup.capacity > 0) {
      const taken = await Volunteer.countDocuments({ eventRef: event._id, deletedAt: null });
      spotsLeft = Math.max(0, event.volunteerSignup.capacity - taken);
    }
    res.json(localize({ ...withMaps(event), spotsLeft }, parseLang(req.query.lang)));
  }),
);

publicRouter.get(
  '/gallery',
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = { deletedAt: null };
    if (typeof req.query.event === 'string' && req.query.event) filter.eventRef = req.query.event;
    if (typeof req.query.program === 'string' && req.query.program) filter.programRef = req.query.program;
    if (typeof req.query.album === 'string' && req.query.album) filter.albumRef = req.query.album;
    const items = await GalleryItem.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .limit(Math.min(Number(req.query.limit) || 300, 500))
      .lean();
    res.json(localize(items, parseLang(req.query.lang)));
  }),
);

publicRouter.get(
  '/albums',
  asyncHandler(async (req, res) => {
    const albums = await Album.find({ deletedAt: null }).sort({ order: 1 }).lean();
    res.json(localize(albums, parseLang(req.query.lang)));
  }),
);

publicRouter.get(
  '/programs',
  asyncHandler(async (req, res) => {
    const programs = await Program.find({ deletedAt: null }).sort({ number: 1 }).lean();
    res.json(localize(programs, parseLang(req.query.lang)));
  }),
);

publicRouter.get(
  '/testimonials',
  asyncHandler(async (req, res) => {
    const items = await Testimonial.find({ deletedAt: null, published: true }).sort({ order: 1 }).lean();
    res.json(localize(items, parseLang(req.query.lang)));
  }),
);

publicRouter.get(
  '/impact-cards',
  asyncHandler(async (req, res) => {
    const items = await ImpactCard.find({ deletedAt: null }).sort({ order: 1 }).lean();
    res.json(localize(items, parseLang(req.query.lang)));
  }),
);

publicRouter.post(
  '/volunteers',
  formLimiter,
  validate(volunteerSchema),
  asyncHandler(async (req, res) => {
    const { website: _hp, ...data } = req.body;
    const doc = await Volunteer.create(data);
    let eventTitle = '';
    if (doc.eventRef) {
      const ev = await Event.findById(doc.eventRef).select('title').lean();
      eventTitle = ev?.title?.en ?? '';
    }
    await notifyAdmin(
      `New volunteer: ${doc.name}`,
      {
        Name: doc.name,
        Email: doc.email,
        Phone: doc.phone,
        Interests: doc.interests,
        Availability: doc.availability,
        Event: eventTitle,
        Message: doc.message,
      },
      doc.email,
    );
    res.status(201).json({ ok: true });
  }),
);

publicRouter.post(
  '/contact',
  formLimiter,
  validate(contactSchema),
  asyncHandler(async (req, res) => {
    const { website: _hp, ...data } = req.body;
    const doc = await ContactMessage.create(data);
    await notifyAdmin(
      `New message: ${doc.subject || 'Contact form'}`,
      { Name: doc.name, Email: doc.email, Phone: doc.phone, Subject: doc.subject, Message: doc.message },
      doc.email,
    );
    res.status(201).json({ ok: true });
  }),
);
