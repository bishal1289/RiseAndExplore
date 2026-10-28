import { Schema, model } from 'mongoose';
import { loc } from './_shared.js';

export const HOMEPAGE_SECTIONS = [
  'hero',
  'summer',
  'impact',
  'testimonials',
  'whatWeDo',
  'community',
  'cta',
] as const;

const videoBlock = {
  url: { type: String, default: '' },
  poster: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  label: loc(),
};

const homepageSchema = new Schema(
  {
    sections: {
      type: [
        new Schema(
          {
            key: { type: String, enum: HOMEPAGE_SECTIONS, required: true },
            visible: { type: Boolean, default: true },
          },
          { _id: false },
        ),
      ],
      default: HOMEPAGE_SECTIONS.map((key) => ({ key, visible: true })),
    },
    hero: {
      headline: loc(),
      text: loc(),
      backgroundVideo: { url: { type: String, default: '' }, poster: { type: String, default: '' } },
      watchVideo: videoBlock,
    },
    donation: {
      amounts: { type: [Number], default: [25, 50, 100, 250] },
      defaultAmount: { type: Number, default: 50 },
    },
    summer: {
      chip: loc(),
      heading: loc(),
      text: loc(),
      video: videoBlock,
    },
    impact: {
      heading: loc(),
      linkLabel: loc(),
      linkUrl: { type: String, default: '' },
    },
    whatWeDo: { heading: loc() },
    community: { heading: loc(), buttonLabel: loc() },
    cta: { heading: loc() },
  },
  { timestamps: true },
);

export const Homepage = model('Homepage', homepageSchema);

export async function getHomepage() {
  return (await Homepage.findOne()) ?? (await Homepage.create({}));
}
