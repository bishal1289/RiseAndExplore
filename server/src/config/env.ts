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

export const env = {
  ...parsed,
  isProd: parsed.NODE_ENV === 'production',
  clientOrigins: parsed.CLIENT_URL.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  cloudinaryEnabled: Boolean(
    parsed.CLOUDINARY_CLOUD_NAME && parsed.CLOUDINARY_API_KEY && parsed.CLOUDINARY_API_SECRET,
  ),
};
