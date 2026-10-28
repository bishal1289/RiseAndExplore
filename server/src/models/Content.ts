import { Schema, model } from 'mongoose';
import { loc, softDelete } from './_shared.js';

const programSchema = new Schema(
  {
    title: loc(true),
    slug: { type: String, required: true, unique: true },
    number: { type: Number, default: 1 },
    shortText: loc(),
    body: loc(),
    image: { type: String, default: '' },
    imageAlt: loc(),
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
softDelete(programSchema);
export const Program = model('Program', programSchema);

const testimonialSchema = new Schema(
  {
    quote: loc(true),
    name: { type: String, required: true },
    organization: loc(),
    videoUrl: { type: String, default: '' },
    poster: { type: String, default: '' },
    duration: { type: Number, default: 0 },
    videoCaption: loc(),
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
softDelete(testimonialSchema);
export const Testimonial = model('Testimonial', testimonialSchema);

const impactCardSchema = new Schema(
  {
    title: loc(true),
    description: loc(),
    image: { type: String, default: '' },
    imageAlt: loc(),
    dateLabel: loc(),
    eventRef: { type: Schema.Types.ObjectId, ref: 'Event' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);
softDelete(impactCardSchema);
export const ImpactCard = model('ImpactCard', impactCardSchema);
