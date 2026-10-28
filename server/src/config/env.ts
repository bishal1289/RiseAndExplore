import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/rise'),
  JWT_SECRET: z.string().default('dev-only-secret-change-me-please'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SERVER_URL: z.string().default('http://localhost:4000'),
  SITE_URL: z.string().default('http://localhost:5173'),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_NAME: z.string().default('RISE Owner'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('RISE <no-reply@rise.org>'),
  NOTIFICATION_EMAIL: z.string().optional(),
  ZEFFY_DONATION_FORM_URL: z.string().default(''),
  ZEFFY_WEBHOOK_SECRET: z.string().optional(),
  GIVEBUTTER_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = schema.parse(process.env);

if (parsed.NODE_ENV === 'production' && parsed.JWT_SECRET.startsWith('dev-only')) {
  throw new Error('JWT_SECRET must be set in production');
}

/**
 * CORS allow-list: everything in CLIENT_URL plus the public website itself (SITE_URL).
 * Browsers send the Origin without a path or trailing slash, so normalize what was typed in the dashboard.
 */
function allowedOrigins(clientUrl: string, siteUrl: string) {
  const origins = new Set<string>();
  for (const raw of [...clientUrl.split(','), siteUrl]) {
    const value = raw.trim().replace(/^["']|["']$/g, '');
    if (!value) continue;
    try {
      origins.add(new URL(value).origin);
    } catch {
      console.warn(`[cors] ignoring invalid origin "${value}" — use a full URL like https://example.org`);
    }
  }
  return [...origins];
}

export const env = {
  ...parsed,
  isProd: parsed.NODE_ENV === 'production',
  clientOrigins: allowedOrigins(parsed.CLIENT_URL, parsed.SITE_URL),
  cloudinaryEnabled: Boolean(
    parsed.CLOUDINARY_CLOUD_NAME && parsed.CLOUDINARY_API_KEY && parsed.CLOUDINARY_API_SECRET,
  ),
};
