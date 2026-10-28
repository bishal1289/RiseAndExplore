import { Schema, model, type InferSchemaType } from 'mongoose';
import { imageRef, loc, softDelete } from './_shared.js';

export const EVENT_TYPES = ['community-meal', 'pantry-fill', 'clothing-drive', 'other'] as const;
export const EVENT_STATUSES = ['draft', 'published', 'scheduled'] as const;

const photoSchema = new Schema({
  ...imageRef,
  caption: loc(),
});

const videoSchema = new Schema({
  media: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
  kind: { type: String, enum: ['file', 'embed'], default: 'file' },
  url: { type: String, required: true },
  caption: loc(),
  duration: { type: Number, default: 0 },
  poster: { type: String, default: '' },
  orientation: { type: String, enum: ['vertical', 'horizontal', 'square'], default: 'horizontal' },
  isMain: { type: Boolean, default: false },
});

const eventSchema = new Schema(
  {
    title: loc(true),
    slug: { type: String, required: true, unique: true, index: true },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    locationName: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    eventType: { type: String, enum: EVENT_TYPES, default: 'other' },
    summary: loc(),
    body: loc(),
    coverImage: imageRef,
    gallery: [photoSchema],
    videos: [videoSchema],
    featured: { type: Boolean, default: false },
    featuredAt: { type: Date },
    status: { type: String, enum: EVENT_STATUSES, default: 'draft', index: true },
    publishAt: { type: Date },
    volunteerSignup: {
      enabled: { type: Boolean, default: false },
      capacity: { type: Number, default: 0 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

softDelete(eventSchema);

/** Query matching events visitors may see. */
export const publicEventFilter = () => ({
  deletedAt: null,
  $or: [{ status: 'published' }, { status: 'scheduled', publishAt: { $lte: new Date() } }],
});

export const mapsUrlFor = (e: { locationName?: string; address?: string; city?: string }) => {
  const q = [e.locationName, e.address, e.city].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
};

export type EventDoc = InferSchemaType<typeof eventSchema>;
export const Event = model('Event', eventSchema);
