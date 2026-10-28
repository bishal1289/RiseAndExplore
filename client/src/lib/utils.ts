export const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

/** 97 → "1:37" */
export function formatDuration(seconds?: number) {
  if (!seconds || seconds < 1) return '';
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

const locale = (lang: string) => (lang.startsWith('es') ? 'es-US' : 'en-US');

export const formatDate = (date: string | Date, lang: string, opts: Intl.DateTimeFormatOptions = { dateStyle: 'long' }) =>
  new Intl.DateTimeFormat(locale(lang), { timeZone: 'America/Chicago', ...opts }).format(new Date(date));

export const dateBadge = (date: string | Date, lang: string) => ({
  month: formatDate(date, lang, { month: 'short' }).replace('.', '').toUpperCase(),
  day: formatDate(date, lang, { day: 'numeric' }),
});

/** "14:00" → "2:00 PM" (en) / "14:00" (es) */
export function formatTime(hhmm: string, lang: string) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return new Intl.DateTimeFormat(locale(lang), { hour: 'numeric', minute: '2-digit' }).format(d);
}

/**
 * Responsive image URL. Cloudinary URLs get f_auto,q_auto + width; Unsplash gets its own params.
 */
export function imageUrl(url: string | undefined, width = 1200, height?: number) {
  if (!url) return '/placeholder.svg';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/')) {
    const t = ['f_auto', 'q_auto', `w_${width}`, height ? `h_${height}` : '', height ? 'c_fill,g_auto' : 'c_limit']
      .filter(Boolean)
      .join(',');
    return url.replace('/upload/', `/upload/${t}/`);
  }
  if (url.includes('images.unsplash.com')) {
    const u = new URL(url);
    u.searchParams.set('w', String(width));
    if (height) u.searchParams.set('h', String(height));
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    return u.toString();
  }
  return url;
}

export const srcSet = (url: string | undefined, widths: number[], ratio?: number) =>
  url && (url.includes('res.cloudinary.com') || url.includes('images.unsplash.com'))
    ? widths.map((w) => `${imageUrl(url, w, ratio ? Math.round(w * ratio) : undefined)} ${w}w`).join(', ')
    : undefined;

/** Returns an iframe URL for YouTube/Vimeo links, or null for direct video files. */
export function embedUrl(url: string, autoplay = true): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&playsinline=1${autoplay ? '&autoplay=1' : ''}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?dnt=1${autoplay ? '&autoplay=1' : ''}`;
  return null;
}

/** Cloudinary: optimized delivery for video files. */
export const videoUrl = (url: string) =>
  url.includes('res.cloudinary.com') && url.includes('/video/upload/') && !url.includes('q_auto')
    ? url.replace('/upload/', '/upload/q_auto,vc_auto/')
    : url;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
