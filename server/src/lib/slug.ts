import slugifyLib from 'slugify';
import type { Model } from 'mongoose';

const slugify = slugifyLib as unknown as (s: string, o?: object) => string;

export const toSlug = (s: string) => slugify(s, { lower: true, strict: true, trim: true });

/** Returns a slug unique within the collection, appending -2, -3… when taken. */
export async function uniqueSlug(model: Model<any>, base: string, excludeId?: string) {
  const root = toSlug(base) || 'item';
  let candidate = root;
  let n = 2;
  while (
    await model.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })
  ) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}
