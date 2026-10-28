import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { Settings } from '../models/Settings.js';

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ENTITIES[c]);

export async function sendMail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  if (!transporter) {
    console.log(
      `[mail:dev] To: ${opts.to}\nSubject: ${opts.subject}\n${opts.html.replace(/<[^>]+>/g, ' ')}`,
    );
    return;
  }
  try {
    await transporter.sendMail({ from: env.MAIL_FROM, ...opts });
  } catch (err) {
    console.error('[mail] failed to send', err);
  }
}

/** Plain, readable email listing form fields — used for volunteer & contact notifications. */
export async function notifyAdmin(
  subject: string,
  fields: Record<string, unknown>,
  replyTo?: string,
) {
  const settings = await Settings.findOne().lean();
  const to = settings?.notificationEmail || env.NOTIFICATION_EMAIL;
  if (!to) return;
  const rows = Object.entries(fields)
    .map(([k, v]) => {
      const value = Array.isArray(v) ? v.join(', ') : String(v ?? '');
      return `<tr><td style="padding:6px 12px;color:#5B6B7C;vertical-align:top"><b>${escape(k)}</b></td><td style="padding:6px 12px">${escape(value).replace(/\n/g, '<br>')}</td></tr>`;
    })
    .join('');
  await sendMail({
    to,
    subject,
    replyTo,
    html: `<div style="font-family:Arial,sans-serif;color:#1E2A38"><h2 style="color:#0F2238">${escape(subject)}</h2><table>${rows}</table><p><a href="${env.SITE_URL}/admin">Open the RISE admin panel</a></p></div>`,
  });
}

export function actionEmail(title: string, body: string, buttonLabel: string, url: string) {
  return `<div style="font-family:Arial,sans-serif;color:#1E2A38;max-width:520px">
    <h2 style="color:#0F2238">${escape(title)}</h2>
    <p>${escape(body)}</p>
    <p><a href="${url}" style="display:inline-block;background:#1673C6;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold">${escape(buttonLabel)}</a></p>
    <p style="color:#5B6B7C;font-size:13px">If the button doesn't work, copy this link: ${url}</p>
  </div>`;
}
