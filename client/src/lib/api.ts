export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export async function api<T>(
  path: string,
  opts: { method?: Method; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const isForm = opts.body instanceof FormData;
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: opts.method ?? 'GET',
    credentials: 'include',
    signal: opts.signal,
    headers: opts.body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? (isForm ? (opts.body as FormData) : JSON.stringify(opts.body)) : undefined,
  });
  if (!res.ok) {
    let message = res.statusText || 'Request failed';
    try {
      const data = await res.json();
      message = data.error ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const withLang = (path: string, lang: string) =>
  `${path}${path.includes('?') ? '&' : '?'}lang=${lang}`;
