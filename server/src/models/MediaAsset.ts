import { Schema, model, type InferSchemaType } from 'mongoose';
import { loc, softDelete } from './_shared.js';

const mediaSchema = new Schema(
  {
    publicId: { type: String, default: '', index: true },
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'embed'], required: true, index: true },
    provider: { type: String, enum: ['cloudinary', 'youtube', 'vimeo', 'external'], default: 'cloudinary' },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    orientation: { type: String, enum: ['vertical', 'horizontal', 'square'], default: 'horizontal' },
    duration: { type: Number, default: 0 },
    posterUrl: { type: String, default: '' },
    bytes: { type: Number, default: 0 },
    format: { type: String, default: '' },
    folder: { type: String, default: 'rise/media' },
    status: { type: String, enum: ['processing', 'ready'], default: 'ready' },
    caption: loc(),
    alt: loc(),
    tags: { type: [String], default: [], index: true },
    eventRef: { type: Schema.Types.ObjectId, ref: 'Event' },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

softDelete(mediaSchema);
mediaSchema.index({ 'caption.en': 'text', 'caption.es': 'text', tags: 'text' });

export const orientationOf = (w: number, h: number) =>
  !w || !h ? 'horizontal' : Math.abs(w - h) / Math.max(w, h) < 0.05 ? 'square' : h > w ? 'vertical' : 'horizontal';

export type MediaAssetDoc = InferSchemaType<typeof mediaSchema>;
export const MediaAsset = model('MediaAsset', mediaSchema);
