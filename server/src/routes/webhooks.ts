import crypto from 'node:crypto';
import { Router, type Request } from 'express';
import { asyncHandler, HttpError } from '../lib/http.js';
import { env } from '../config/env.js';
import { cloudinary } from '../config/cloudinary.js';
import { Donation, Order } from '../models/Logs.js';
import { MediaAsset } from '../models/MediaAsset.js';

export const webhooksRouter = Router();

const safeEqual = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
};

const rawBody = (req: Request) => (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8') ?? '';

/**
 * Zeffy → Zapier → here. Configure the Zapier "Webhooks by Zapier" POST action
 * with header `x-webhook-secret: <ZEFFY_WEBHOOK_SECRET>` and map the payment fields.
 */
webhooksRouter.post(
  '/zeffy',
  asyncHandler(async (req, res) => {
    const secret = env.ZEFFY_WEBHOOK_SECRET;
    const given = req.header('x-webhook-secret') ?? '';
    if (!secret || !safeEqual(given, secret)) throw new HttpError(401, 'Invalid secret');
    const b = req.body ?? {};
    const externalId = String(b.id ?? b.payment_id ?? b.transaction_id ?? '');
    if (externalId && (await Donation.exists({ externalId }))) return res.json({ ok: true, duplicate: true });
    await Donation.create({
      provider: 'zeffy',
      externalId,
      amount: Number(b.amount ?? b.total ?? 0),
      currency: String(b.currency ?? 'USD'),
      recurring: Boolean(b.recurring ?? b.is_recurring ?? false),
      donorName: String(b.name ?? [b.first_name, b.last_name].filter(Boolean).join(' ') ?? ''),
      donorEmail: String(b.email ?? ''),
      receivedAt: b.date ? new Date(b.date) : new Date(),
      raw: b,
    });
    res.json({ ok: true });
  }),
);

/**
 * Givebutter webhooks send the signing secret in the `Signature` header.
 * https://docs.givebutter.com/reference/webhooks
 */
webhooksRouter.post(
  '/givebutter',
  asyncHandler(async (req, res) => {
    const secret = env.GIVEBUTTER_WEBHOOK_SECRET;
    const given = req.header('signature') ?? '';
    if (!secret || !safeEqual(given, secret)) throw new HttpError(401, 'Invalid signature');
    const { event, data } = req.body ?? {};
    const externalId = String(data?.id ?? '');
    if (externalId && (await Order.exists({ externalId }))) return res.json({ ok: true, duplicate: true });
    await Order.create({
      provider: 'givebutter',
      externalId,
      event: String(event ?? ''),
      amount: Number(data?.amount ?? data?.total ?? 0),
      currency: String(data?.currency ?? 'USD'),
      customerName: [data?.first_name, data?.last_name].filter(Boolean).join(' '),
      customerEmail: String(data?.email ?? ''),
      raw: req.body,
    });
    res.json({ ok: true });
  }),
);

/** Cloudinary eager/notification callback — marks videos ready once transcoding is done. */
webhooksRouter.post(
  '/cloudinary',
  asyncHandler(async (req, res) => {
    if (!env.cloudinaryEnabled) throw new HttpError(400, 'Cloudinary not configured');
    const timestamp = Number(req.header('x-cld-timestamp'));
    const signature = req.header('x-cld-signature') ?? '';
    const valid = cloudinary.utils.verifyNotificationSignature(rawBody(req), timestamp, signature, 7200);
    if (!valid) throw new HttpError(401, 'Invalid signature');
    const publicId: string | undefined = req.body?.public_id;
    if (publicId) {
      const eager = Array.isArray(req.body.eager) ? req.body.eager[0] : undefined;
      await MediaAsset.updateOne(
        { publicId },
        {
          status: 'ready',
          ...(eager?.secure_url ? { url: eager.secure_url } : {}),
        },
      );
    }
    res.json({ ok: true });
  }),
);
