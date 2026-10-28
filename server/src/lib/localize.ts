import { Types } from 'mongoose';

export type Lang = 'en' | 'es';

export const parseLang = (v: unknown): Lang | undefined =>
  v === 'en' || v === 'es' ? v : undefined;

const isLocalized = (v: Record<string, unknown>) => {
  const keys = Object.keys(v).filter((k) => k !== '_id');
  return (
    keys.length > 0 &&
    keys.every((k) => k === 'en' || k === 'es') &&
    keys.every((k) => typeof v[k] === 'string' || v[k] == null)
  );
};

/**
 * Recursively collapses { en, es } objects into a single string for the requested
 * language (falling back to English when the translation is empty).
 * When no lang is given the document is returned unchanged.
 */
export function localize<T>(value: T, lang?: Lang): T {
  if (!lang) return value;
  const walk = (v: unknown): unknown => {
    if (v == null || typeof v !== 'object') return v;
    if (v instanceof Date) return v;
    if (v instanceof Types.ObjectId) return v.toString();
    if (Array.isArray(v)) return v.map(walk);
    const obj = v as Record<string, unknown>;
    if (isLocalized(obj)) return (obj[lang] as string) || (obj.en as string) || '';
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(obj)) out[k] = walk(val);
    return out;
  };
  return walk(value) as T;
}
