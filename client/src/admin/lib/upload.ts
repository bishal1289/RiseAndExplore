import imageCompression from 'browser-image-compression';
import { adminApi } from './hooks';
import type { MediaAsset } from './types';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
export const ACCEPT = '.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov,.webm,image/*,video/mp4,video/quicktime,video/webm';
export const MAX_FILES = 50;
const CHUNK_SIZE = 6 * 1024 * 1024;
const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024;

export type UploadFolder = 'rise/events' | 'rise/gallery' | 'rise/homepage' | 'rise/programs' | 'rise/testimonials' | 'rise/media';

const isHeic = (f: File) => /\.(heic|heif)$/i.test(f.name) || f.type === 'image/heic' || f.type === 'image/heif';

export function kindOf(file: File): 'image' | 'video' | null {
  if (file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name)) return 'video';
  if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) return 'image';
  return null;
}

/** HEIC → JPEG, then resize to max 2560px and compress — all in the browser. */
export async function prepareImage(file: File): Promise<File> {
  let input: File = file;
  if (isHeic(file)) {
    const { default: heic2any } = await import('heic2any');
    const out = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
    const blob = Array.isArray(out) ? out[0] : out;
    input = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' });
  }
  if (input.type === 'image/gif') return input;
  return imageCompression(input, {
    maxWidthOrHeight: 2560,
    maxSizeMB: 4,
    initialQuality: 0.85,
    useWebWorker: true,
    fileType: input.type === 'image/png' ? 'image/png' : 'image/jpeg',
  });
}

interface SignResponse {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
  uploadUrl: string;
  eager?: string;
  eager_async?: string;
  eager_notification_url?: string;
}

interface CloudinaryResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  duration?: number;
  bytes: number;
  format: string;
  resource_type: string;
  eager?: unknown[];
}

function sendChunk(
  url: string,
  form: FormData,
  headers: Record<string, string>,
  signal: AbortSignal,
  onProgress: (loaded: number) => void,
): Promise<CloudinaryResult | null> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          // Intermediate chunk responses have done: false.
          resolve(data.public_id && data.done !== false ? data : null);
        } catch {
          resolve(null);
        }
      } else {
        let message = 'Upload failed';
        try {
          message = JSON.parse(xhr.responseText).error?.message ?? message;
        } catch {
          /* ignore */
        }
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error('Network problem — check your connection and retry'));
    xhr.onabort = () => reject(new DOMException('Upload cancelled', 'AbortError'));
    signal.addEventListener('abort', () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}

/**
 * Uploads straight from the browser to Cloudinary using a server-issued signature.
 * Files over 6 MB are sent in 6 MB chunks (Cloudinary's upload_large protocol),
 * so large phone videos never pass through our API server.
 */
export async function uploadToCloudinary(
  file: File,
  kind: 'image' | 'video',
  folder: UploadFolder,
  signal: AbortSignal,
  onProgress: (fraction: number) => void,
): Promise<CloudinaryResult> {
  if (kind === 'video' && file.size > MAX_VIDEO_BYTES) throw new Error('Videos must be under 2 GB');
  const sign = await adminApi.post<SignResponse>('/uploads/sign', { folder, resourceType: kind });
  const baseFields: Record<string, string> = {
    api_key: sign.apiKey,
    timestamp: String(sign.timestamp),
    signature: sign.signature,
    folder: sign.folder,
  };
  if (sign.eager) {
    baseFields.eager = sign.eager;
    baseFields.eager_async = sign.eager_async ?? 'true';
    if (sign.eager_notification_url) baseFields.eager_notification_url = sign.eager_notification_url;
  }

  const total = file.size;
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let result: CloudinaryResult | null = null;

  for (let start = 0; start < total; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, total);
    const form = new FormData();
    for (const [k, v] of Object.entries(baseFields)) form.append(k, v);
    form.append('file', file.slice(start, end), file.name);
    const headers: Record<string, string> =
      total > CHUNK_SIZE
        ? { 'X-Unique-Upload-Id': uniqueId, 'Content-Range': `bytes ${start}-${end - 1}/${total}` }
        : {};
    const r = await sendChunk(sign.uploadUrl, form, headers, signal, (loaded) =>
      onProgress(Math.min(0.99, (start + loaded) / total)),
    );
    if (r) result = r;
  }
  if (!result) throw new Error('Upload did not complete');
  onProgress(1);
  return result;
}

/** Full pipeline: prepare → upload to Cloudinary → save MediaAsset record. */
export async function uploadMedia(
  file: File,
  opts: { folder?: UploadFolder; eventRef?: string | null; signal: AbortSignal; onProgress: (f: number) => void; onStage?: (s: string) => void },
): Promise<MediaAsset> {
  const kind = kindOf(file);
  if (!kind) throw new Error('Unsupported file type. Use JPG, PNG, HEIC, WebP, MP4, MOV or WebM.');
  let toUpload = file;
  if (kind === 'image') {
    opts.onStage?.('Optimizing…');
    toUpload = await prepareImage(file);
  }
  opts.onStage?.('Uploading…');
  const r = await uploadToCloudinary(toUpload, kind, opts.folder ?? 'rise/media', opts.signal, opts.onProgress);
  opts.onStage?.('Saving…');
  const caption = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  return adminApi.post<MediaAsset>('/media', {
    publicId: r.public_id,
    url: r.secure_url,
    type: kind,
    width: r.width,
    height: r.height,
    duration: r.duration ?? 0,
    bytes: r.bytes,
    format: r.format,
    folder: opts.folder ?? 'rise/media',
    caption: { en: kind === 'video' ? caption : '', es: '' },
    alt: { en: '', es: '' },
    tags: [],
    eventRef: opts.eventRef ?? null,
    processing: kind === 'video',
  });
}

export const formatBytes = (b: number) => {
  if (!b) return '—';
  const u = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(u.length - 1, Math.floor(Math.log(b) / Math.log(1024)));
  return `${(b / 1024 ** i).toFixed(i ? 1 : 0)} ${u[i]}`;
};
