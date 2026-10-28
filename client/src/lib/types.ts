/** Types returned by the public API with ?lang= (bilingual fields collapsed to strings). */

export type Orientation = 'vertical' | 'horizontal' | 'square';
export type EventType = 'community-meal' | 'pantry-fill' | 'clothing-drive' | 'other';

export interface ImageRef {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface VideoItem {
  _id?: string;
  kind: 'file' | 'embed';
  url: string;
  caption: string;
  duration: number;
  poster: string;
  orientation: Orientation;
  isMain: boolean;
}

export interface Photo extends ImageRef {
  _id?: string;
  caption: string;
}

export interface EventSummary {
  _id: string;
  title: string;
  slug: string;
  date: string;
  startTime: string;
  endTime: string;
  locationName: string;
  address: string;
  city: string;
  eventType: EventType;
  summary: string;
  coverImage: ImageRef;
  featured: boolean;
  mapsUrl: string;
  videos?: VideoItem[];
}

export interface EventDetail extends EventSummary {
  body: string;
  gallery: Photo[];
  videos: VideoItem[];
  volunteerSignup: { enabled: boolean; capacity: number };
  spotsLeft: number | null;
}

export interface GalleryItem {
  _id: string;
  image: string;
  width: number;
  height: number;
  caption: string;
  alt: string;
  eventRef?: string;
  programRef?: string;
  albumRef?: string;
}

export interface Album {
  _id: string;
  title: string;
  slug: string;
  cover: string;
  eventRef?: string;
}

export interface Program {
  _id: string;
  title: string;
  slug: string;
  number: number;
  shortText: string;
  body: string;
  image: string;
  imageAlt: string;
}

export interface Testimonial {
  _id: string;
  quote: string;
  name: string;
  organization: string;
  videoUrl: string;
  poster: string;
  duration: number;
  videoCaption: string;
}

export interface ImpactCardData {
  _id: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  dateLabel: string;
}

export type SectionKey = 'hero' | 'summer' | 'impact' | 'testimonials' | 'whatWeDo' | 'community' | 'cta';

export interface VideoBlock {
  url: string;
  poster: string;
  duration: number;
  label: string;
}

export interface HomepageContent {
  sections: { key: SectionKey; visible: boolean }[];
  hero: {
    headline: string;
    text: string;
    backgroundVideo: { url: string; poster: string };
    watchVideo: VideoBlock;
  };
  donation: { amounts: number[]; defaultAmount: number };
  summer: { chip: string; heading: string; text: string; video: VideoBlock };
  impact: { heading: string; linkLabel: string; linkUrl: string };
  whatWeDo: { heading: string };
  community: { heading: string; buttonLabel: string };
  cta: { heading: string };
}

export interface HomeData {
  homepage: HomepageContent;
  featuredEvents: EventSummary[];
  impactCards: ImpactCardData[];
  testimonials: Testimonial[];
  programs: Program[];
  community: GalleryItem[];
}

export interface SiteSettings {
  orgName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  mapEmbedUrl: string;
  social: Record<'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'linkedin', string>;
  zeffyFormUrl: string;
  givebutter: {
    accountId: string;
    shopWidgetId: string;
    storeUrl: string;
    featuredProducts: { title: string; price: string; image: string; url: string }[];
  };
  footerText: string;
}
