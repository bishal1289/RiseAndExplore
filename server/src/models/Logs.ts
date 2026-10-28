import { Schema, model } from 'mongoose';

const activitySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: 'System' },
    action: {
      type: String,
      enum: ['created', 'updated', 'published', 'deleted', 'restored', 'uploaded', 'purged'],
      required: true,
    },
    entityType: { type: String, required: true },
    entityId: { type: String, default: '' },
    label: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
activitySchema.index({ createdAt: -1 });
export const ActivityLog = model('ActivityLog', activitySchema);

const donationSchema = new Schema(
  {
    provider: { type: String, default: 'zeffy' },
    externalId: { type: String, index: true },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    recurring: { type: Boolean, default: false },
    donorName: { type: String, default: '' },
    donorEmail: { type: String, default: '' },
    receivedAt: { type: Date, default: () => new Date() },
    raw: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);
export const Donation = model('Donation', donationSchema);

const orderSchema = new Schema(
  {
    provider: { type: String, default: 'givebutter' },
    externalId: { type: String, index: true },
    event: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    customerName: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    raw: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);
export const Order = model('Order', orderSchema);
