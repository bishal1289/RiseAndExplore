# RISE – Resourceful Impact in Scholastic Education

Bilingual (English / Spanish) nonprofit website with a simple, phone-friendly admin panel.
MERN stack, TypeScript throughout.

| Part | Stack |
| --- | --- |
| `client/` | React 18 · Vite · TypeScript · Tailwind · React Router 6 (data router) · react-i18next · Framer Motion · TanStack Query · React Helmet Async · TipTap · dnd-kit · yet-another-react-lightbox |
| `server/` | Node 20 · Express · TypeScript · MongoDB/Mongoose · Zod · JWT (httpOnly cookie) · Helmet · CORS · express-rate-limit · Cloudinary · Multer · Nodemailer |
| Payments | **Zeffy** for all donations (iframe embed) · **Givebutter** for the shop (widget) — no card data ever touches this app |

---

## 1. Quick start (local)

Requirements: Node 20+, a MongoDB (local or a free Atlas cluster).

```bash
npm install                          # installs root + client + server workspaces
cp server/.env.example server/.env   # then edit values
cp client/.env.example client/.env
npm run seed                         # sample EN/ES content + first Owner account
npm run dev                          # API on :4000, site on :5173
```

- Site: http://localhost:5173
- Admin: http://localhost:5173/admin — sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `server/.env`.

`npm run seed` is safe to re-run: it only creates the owner if missing and only seeds content into an
empty database. Use `npm run seed -w server -- --reset` to wipe and re-seed the sample content.

Without SMTP settings, emails (form notifications, password resets, invitations) are printed to the
server console instead — handy for local testing.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API (tsx watch) + Vite dev server together |
| `npm run build` | Compile server to `server/dist`, build client to `client/dist` |
| `npm run seed` | Seed sample content and the first Owner |
| `npm run typecheck` / `npm run lint` / `npm run format` | Quality checks |

---

## 2. Project structure

```
rise/
├── package.json               # npm workspaces + shared scripts
├── .prettierrc
├── client/
│   ├── index.html             # fonts (Fraunces 900 + Figtree), meta
│   ├── tailwind.config.ts     # design tokens (colors, radii, type scale)
│   ├── vercel.json            # SPA rewrites + sitemap proxy
│   ├── public/                # logo.svg, logo-white.svg, favicon.svg, placeholder.svg, robots.txt
│   └── src/
│       ├── main.tsx · App.tsx # providers, lazy routes
│       ├── index.css          # base styles, .h1/.h2/.label/.input utilities
│       ├── i18n/              # i18next setup + locales/en.json, es.json
│       ├── lib/               # api client, types, utils (Cloudinary transforms, dates, embeds)
│       ├── hooks/             # usePublic (lang-aware queries), useGivebutter, useScrolledPast
│       ├── layout/            # Header, MobileDrawer, Footer, BackToTop, Layout
│       ├── components/
│       │   ├── ui/            # Button, Chip, SectionHeading, Modal, Img, Reveal, LanguageToggle, Skeleton
│       │   ├── donate/        # DonateCard, DonateProvider (modal), ZeffyEmbed
│       │   ├── home/          # Hero, SummerEvents, ImpactSection, Testimonials, WhatWeDo, CommunityRow, CtaBanner, HomeView
│       │   ├── form/Field.tsx # accessible label/error wiring + honeypot
│       │   └── VideoCard, VideoPlayer, EventRow, ImpactCard, ProgramCard, PhotoGrid, PageHeader, Seo
│       ├── pages/             # Home, About, Programs, Events, EventDetail, Gallery, GetInvolved, Shop, Donate, Contact, NotFound
│       └── admin/
│           ├── AdminRoot.tsx · AuthContext.tsx
│           ├── lib/           # hooks (queries/mutations + toasts), upload (HEIC, compression, chunked Cloudinary), types
│           ├── components/    # AdminLayout, Uploader, MediaPicker, MediaThumb, RichText, Sortable, Confirm, ui, useUnsavedChanges
│           └── pages/         # Dashboard, MediaLibrary, EventsList, EventEditor, EventPreview, GalleryManager,
│                              # HomepageEditor, ProgramsAdmin, TestimonialsAdmin, Inbox, SettingsPage, Users, Trash, Guide,
│                              # Login, PasswordPages
└── server/
    └── src/
        ├── index.ts · app.ts  # bootstrap, middleware, routers
        ├── config/            # env (Zod-validated), db, cloudinary
        ├── models/            # Event, MediaAsset, Gallery (GalleryItem + Album), Content (Program, Testimonial, ImpactCard),
        │                      # Inbox (Volunteer, ContactMessage), Settings, Homepage, User, Logs (ActivityLog, Donation, Order)
        ├── schemas/           # Zod request schemas
        ├── middleware/        # auth (JWT cookie, roles), validate, error
        ├── lib/               # localize (?lang=), mailer, sanitize, slug, activity log, media usage
        ├── routes/            # public, auth, webhooks, seo (sitemap.xml), admin/* (CRUD factory + specialised routers)
        ├── jobs/trash.ts      # 30-day Trash purge (also deletes Cloudinary files)
        └── seed/              # sample data + seed script
```

---

## 3. How it works

### Bilingual content
- UI strings live in `client/src/i18n/locales/{en,es}.json`.
- Every CMS text field is stored as `{ en, es }`. Public endpoints accept `?lang=es` and return plain
  strings (falling back to English when a translation is empty).
- The language toggle persists to `localStorage` (`rise-lang`); `?lang=es` links also work (used in the sitemap's hreflang tags).
- The admin panel UI itself is English; every content field has English / Español tabs with a yellow dot when Spanish is missing.

### Media uploads (Cloudinary)
1. The browser converts HEIC → JPEG and resizes/compresses photos to max 2560px (`browser-image-compression`).
2. It asks the API for a signature: `POST /api/admin/uploads/sign`.
3. It uploads **directly to Cloudinary**, in 6 MB chunks for large files (Cloudinary's `upload_large`
   protocol via `X-Unique-Upload-Id` + `Content-Range`), with per-file progress, cancel and retry.
4. It saves the record: `POST /api/admin/media`. Width/height → orientation (vertical 9:16 or horizontal),
   duration and a poster frame are filled in automatically.
5. Videos get an async MP4 transcode; Cloudinary calls `POST /api/webhooks/cloudinary` when done, and the
   admin shows "Processing…" until then.

Photos and videos are delivered with `f_auto,q_auto` and responsive widths.

### Content rules
- Public API only returns published content (events: `published`, or `scheduled` once `publishAt` has passed).
- At most **2 featured events**; featuring a third un-features the one featured the longest and the admin sees a notice.
- Deletes are soft: items go to the **Trash** for 30 days, then a job removes them (and their Cloudinary files).
- Rich text is sanitised on the server (`sanitize-html`).
- Every create/edit/publish/delete is written to the **ActivityLog** and shown on the dashboard.

### Auth
- JWT in an httpOnly cookie, 7-day expiry. Login and password-reset routes are rate-limited.
- Roles: **Owner** (everything) and **Editor** (content only — no Settings or Users).
- Owners invite people by email; the invitation and "forgot password" links share one flow
  (`/admin/reset-password?token=…`). Reset links expire after 1 hour, invitations after 3 days.
- There must always be at least one active Owner.

---

## 4. Integrations

### Zeffy (donations)
1. In Zeffy, open your donation form → **Share → Embed** and copy the iframe `src`
   (`https://www.zeffy.com/embed/donation-form/<slug>`).
2. Paste it in **Admin → Settings → Donations** (or set `ZEFFY_DONATION_FORM_URL` as a fallback).
3. The `/donate` page embeds it; every other Donate button opens the same form in a modal.

The amount/frequency picker on the homepage card is a visual nudge. Zeffy's embed doesn't document
prefill parameters, so the modal shows "You picked $50 (Monthly)" above the form instead of passing it in.

**Optional donation log:** Zeffy → Zapier ("New Payment") → *Webhooks by Zapier* POST to
`https://<api>/api/webhooks/zeffy` with header `x-webhook-secret: <ZEFFY_WEBHOOK_SECRET>` and JSON fields
`id, amount, currency, email, name, recurring, date`. Totals appear on the dashboard.

### Givebutter (shop)
1. Find your **account ID** and the store **widget ID** in Givebutter → Settings → Widgets.
2. Enter them in **Admin → Settings → Shop** (or set `VITE_GIVEBUTTER_ACCOUNT_ID` on the client).
3. Optionally add up to 6 featured products shown above the store.

**Optional order log:** add a Givebutter webhook to `https://<api>/api/webhooks/givebutter` and set
`GIVEBUTTER_WEBHOOK_SECRET` to its signing secret (sent in the `Signature` header).

### Cloudinary
Create a free account, then set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
`SERVER_URL` must be the public API URL so Cloudinary can reach `/api/webhooks/cloudinary`.
Until Cloudinary is configured, uploads show a friendly "not set up yet" message.

### Email
Any SMTP provider works. For **Resend**: host `smtp.resend.com`, port `465`, user `resend`,
password = your API key, and `MAIL_FROM` on a verified domain. Set the notification address in
Admin → Settings (or `NOTIFICATION_EMAIL`).

---

## 5. Deploy

### Database — MongoDB Atlas
1. Create a free M0 cluster, a database user, and allow access from anywhere (`0.0.0.0/0`) or Render's IPs.
2. Copy the connection string into `MONGODB_URI` (e.g. `mongodb+srv://user:pass@cluster.x.mongodb.net/rise`).

### API — Render (or Railway)
- New **Web Service** from this repo, root directory `server`.
- Build command: `npm install --include=dev && npm run build`
- Start command: `npm start`
- Environment: everything in `server/.env.example`, with:
  - `NODE_ENV=production`
  - `JWT_SECRET` = a long random string (`openssl rand -hex 32`) — required in production
  - `CLIENT_URL=https://your-site.vercel.app` (comma-separate multiple domains)
  - `SERVER_URL=https://your-api.onrender.com`, `SITE_URL=https://your-domain.org`
- After the first deploy, run the seed once from the Render shell: `npm run seed`.

In production the session cookie is `SameSite=None; Secure` so it works across the Vercel and Render
domains. For the best results (Safari blocks some third-party cookies), serve the API from a subdomain
of the site, e.g. `api.riseorg.org`.

### Website — Vercel
- Import the repo, **root directory `client`**, framework preset **Vite**.
- Environment: `VITE_API_URL=https://your-api.onrender.com`, `VITE_SITE_URL=https://your-domain.org`,
  optionally `VITE_GIVEBUTTER_ACCOUNT_ID`.
- In `client/vercel.json`, replace `YOUR-API-DOMAIN` so `/sitemap.xml` is proxied to the API.
- In `client/public/robots.txt`, replace `YOUR-SITE-DOMAIN`.

---

## 6. Quality notes
- **Responsive** at 375 / 768 / 1280+; mobile nav is a full-height drawer, the admin sidebar becomes a bottom tab bar.
- **Accessibility:** semantic landmarks, skip links, focus rings, focus-trapped modals with Esc, labelled video
  buttons, form errors tied to inputs with `aria-describedby`, required alt text for photos, `prefers-reduced-motion`
  respected (no background video autoplay, no scroll animations).
- **Performance:** route-level code splitting, lazy images with `srcset`, Cloudinary `f_auto,q_auto`, video posters,
  `preload="metadata"`, heavy admin-only libraries (TipTap, heic2any, dnd-kit) never load on the public site.
- **SEO:** per-page title/description/OG/canonical/hreflang, `sitemap.xml`, `robots.txt`, JSON-LD `NGO`/`NonprofitOrganization`
  site-wide and `Event` on event pages.

## 7. Sample content
The seed uses Unsplash photos and Cloudinary demo videos as placeholders. Replace them from
**Admin → Media Library** and **Admin → Homepage** with real RISE footage. The About page's team and partner
lists are placeholders in `client/src/pages/About.tsx`.
