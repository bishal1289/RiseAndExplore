import { Schema } from 'mongoose';

export interface Localized {
  en: string;
  es: string;
}

/** Bilingual text field: { en, es }. */
export const loc = (required = false) => ({
  en: { type: String, default: '', trim: true, required },
  es: { type: String, default: '', trim: true },
});

/** Adds a `deletedAt` field for the 30-day Trash. */
export function softDelete(schema: Schema) {
  schema.add({ deletedAt: { type: Date, default: null, index: true } });
}

export const NOT_DELETED = { deletedAt: null };

/** A reference to an image used somewhere in content. */
export const imageRef = {
  url: { type: String, default: '' },
  media: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
  alt: loc(),
  width: Number,
  height: Number,
};
