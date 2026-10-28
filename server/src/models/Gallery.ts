import { Schema, model } from 'mongoose';
import { loc, softDelete } from './_shared.js';

const albumSchema = new Schema(
  {
    title: loc(true),
    slug: { type: String, required: true, unique: true },
    cover: { type: String, default: '' },
    eventRef: { type: Schema.Types.ObjectId, ref: 'Event' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
softDelete(albumSchema);
export const Album = model('Album', albumSchema);

const galleryItemSchema = new Schema(
  {
    media: { type: Schema.Types.ObjectId, ref: 'MediaAsset' },
    image: { type: String, required: true },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
    caption: loc(),
    alt: loc(),
    eventRef: { type: Schema.Types.ObjectId, ref: 'Event' },
    programRef: { type: Schema.Types.ObjectId, ref: 'Program' },
    albumRef: { type: Schema.Types.ObjectId, ref: 'Album' },
    order: { type: Number, default: 0, index: true },
    /** 1–4 when shown in the homepage "Community in action" row. */
    homepageSlot: { type: Number, min: 1, max: 4, default: null },
  },
  { timestamps: true },
);
softDelete(galleryItemSchema);
export const GalleryItem = model('GalleryItem', galleryItemSchema);
