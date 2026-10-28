import { Schema, model } from 'mongoose';
import { softDelete } from './_shared.js';

export const INBOX_STATUSES = ['new', 'contacted', 'archived'] as const;

const volunteerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    interests: { type: [String], default: [] },
    availability: { type: String, default: '' },
    message: { type: String, default: '' },
    eventRef: { type: Schema.Types.ObjectId, ref: 'Event' },
    language: { type: String, default: 'en' },
    status: { type: String, enum: INBOX_STATUSES, default: 'new', index: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);
softDelete(volunteerSchema);
export const Volunteer = model('Volunteer', volunteerSchema);

const contactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    subject: { type: String, default: '' },
    message: { type: String, required: true },
    language: { type: String, default: 'en' },
    status: { type: String, enum: INBOX_STATUSES, default: 'new', index: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);
softDelete(contactSchema);
export const ContactMessage = model('ContactMessage', contactSchema);
