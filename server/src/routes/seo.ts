import { Router } from 'express';
import { asyncHandler } from '../lib/http.js';
import { env } from '../config/env.js';
import { Event, publicEventFilter } from '../models/Event.js';
import { Program } from '../models/Content.js';

export const seoRouter = Router();

const STATIC_PATHS = ['/', '/about', '/programs', '/events', '/gallery', '/get-involved', '/shop', '/donate', '/contact'];

seoRouter.get(
  '/sitemap.xml',
  asyncHandler(async (_req, res) => {
    const base = env.SITE_URL.replace(/\/$/, '');
    const [events, programs] = await Promise.all([
      Event.find(publicEventFilter()).select('slug updatedAt').lean(),
      Program.find({ deletedAt: null }).select('updatedAt').sort({ updatedAt: -1 }).limit(1).lean(),
    ]);
    const urls = [
      ...STATIC_PATHS.map((p) => ({
        loc: `${base}${p}`,
        lastmod: p === '/programs' ? programs[0]?.updatedAt : undefined,
      })),
      ...events.map((e) => ({ loc: `${base}/events/${e.slug}`, lastmod: e.updatedAt })),
    ];
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}
    <xhtml:link rel="alternate" hreflang="en" href="${u.loc}?lang=en"/>
    <xhtml:link rel="alternate" hreflang="es" href="${u.loc}?lang=es"/>
  </url>`,
  )
  .join('\n')}
</urlset>`;
    res.type('application/xml').set('Cache-Control', 'public, max-age=3600').send(xml);
  }),
);
