import { Schema, model, type InferSchemaType } from 'mongoose';
import { loc } from './_shared.js';

const productSchema = new Schema({
  title: loc(),
  price: { type: String, default: '' },
  image: { type: String, default: '' },
  url: { type: String, default: '' },
});

const settingsSchema = new Schema(
  {
    orgName: { type: String, default: 'Resourceful Impact in Scholastic Education' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zip: { type: String, default: '' },
    mapEmbedUrl: { type: String, default: '' },
    social: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      tiktok: { type: String, default: '' },
      youtube: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    zeffyFormUrl: { type: String, default: '' },
    givebutter: {
      accountId: { type: String, default: '' },
      shopWidgetId: { type: String, default: '' },
      storeUrl: { type: String, default: '' },
      featuredProducts: { type: [productSchema], default: [] },
    },
    notificationEmail: { type: String, default: '' },
    footerText: loc(),
  },
  { timestamps: true },
);

export type SettingsDoc = InferSchemaType<typeof settingsSchema>;
export const Settings = model('Settings', settingsSchema);

/** Singleton accessor — creates the document on first use. */
export async function getSettings() {
  return (await Settings.findOne()) ?? (await Settings.create({}));
}
