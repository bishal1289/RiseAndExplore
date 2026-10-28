/** Admin-side shapes: bilingual fields stay as { en, es }. */

export interface L {
  en: string;
  es: string;
}

export const emptyL = (): L => ({ en: '', es: '' });

export type Role = 'owner' | 'editor';

export interface AdminUser {
  _id: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  pending?: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface MediaAsset {
  _id: string;
  publicId: string;
  url: string;
  type: 'image' | 'video' | 'embed';
  provider: 'cloudinary' | 'youtube' | 'vimeo' | 'external';
  width: number;
  height: number;
  orientation: 'vertical' | 'horizontal' | 'square';
  duration: number;
  posterUrl: string;
  bytes: number;
  format: string;
  folder: string;
  status: 'processing' | 'ready';
  caption: L;
  alt: L;
  tags: string[];
  eventRef?: string | null;
  createdAt: string;
  usage?: { type: string; id: string; label: string }[];
}

export interface AdminImageRef {
  url: string;
  media?: string | null;
  alt: L;
  width?: number;
  height?: number;
}

export interface AdminPhoto extends AdminImageRef {
  _id?: string;
  caption: L;
}

export interface AdminVideo {
  _id?: string;
  media?: string | null;
  kind: 'file' | 'embed';
  url: string;
  caption: L;
  duration: number;
  poster: string;
  orientation: 'vertical' | 'horizontal' | 'square';
  isMain: boolean;
}

export type EventStatus = 'draft' | 'published' | 'scheduled';
export type EventType = 'community-meal' | 'pantry-fill' | 'clothing-drive' | 'other';

export interface AdminEvent {
  _id?: string;
  title: L;
  slug: string;
  date: string;
  startTime: string;
  endTime: string;
  locationName: string;
  address: string;
  city: string;
  eventType: EventType;
  summary: L;
  body: L;
  coverImage: AdminImageRef;
  gallery: AdminPhoto[];
  videos: AdminVideo[];
  featured: boolean;
  status: EventStatus;
  publishAt?: string | null;
  volunteerSignup: { enabled: boolean; capacity: number };
  mapsUrl?: string;
  photoCount?: number;
}

export interface AdminGalleryItem {
  _id: string;
  media?: string;
  image: string;
  width: number;
  height: number;
  caption: L;
  alt: L;
  eventRef?: string | null;
  programRef?: string | null;
  albumRef?: string | null;
  order: number;
  homepageSlot: number | null;
}

export interface AdminAlbum {
  _id: string;
  title: L;
  slug: string;
  cover: string;
  eventRef?: string | null;
  order: number;
}

export interface AdminProgram {
  _id?: string;
  title: L;
  slug: string;
  number: number;
  shortText: L;
  body: L;
  image: string;
  imageAlt: L;
  order: number;
}

export interface AdminTestimonial {
  _id?: string;
  quote: L;
  name: string;
  organization: L;
  videoUrl: string;
  poster: string;
  duration: number;
  videoCaption: L;
  published: boolean;
  order: number;
}

export interface AdminImpactCard {
  _id?: string;
  title: L;
  description: L;
  image: string;
  imageAlt: L;
  dateLabel: L;
  eventRef?: string | null;
  order: number;
}

export interface VideoBlockL {
  url: string;
  poster: string;
  duration: number;
  label: L;
}

export type SectionKey = 'hero' | 'summer' | 'impact' | 'testimonials' | 'whatWeDo' | 'community' | 'cta';

export interface AdminHomepage {
  sections: { key: SectionKey; visible: boolean }[];
  hero: { headline: L; text: L; backgroundVideo: { url: string; poster: string }; watchVideo: VideoBlockL };
  donation: { amounts: number[]; defaultAmount: number };
  summer: { chip: L; heading: L; text: L; video: VideoBlockL };
  impact: { heading: L; linkLabel: L; linkUrl: string };
  whatWeDo: { heading: L };
  community: { heading: L; buttonLabel: L };
  cta: { heading: L };
}

export interface AdminSettings {
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
    featuredProducts: { title: L; price: string; image: string; url: string }[];
  };
  notificationEmail: string;
  footerText: L;
}

export type InboxStatus = 'new' | 'contacted' | 'archived';

export interface VolunteerRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  interests: string[];
  availability: string;
  message: string;
  eventRef?: { _id: string; title: L; slug: string } | null;
  status: InboxStatus;
  notes: string;
  language: string;
  createdAt: string;
}

export interface MessageRecord {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: InboxStatus;
  notes: string;
  language: string;
  createdAt: string;
}

export interface ActivityEntry {
  _id: string;
  userName: string;
  action: string;
  entityType: string;
  label: string;
  createdAt: string;
}

export interface DashboardData {
  upcomingEvents: { _id: string; title: L; date: string; status: EventStatus; locationName: string; featured: boolean }[];
  upcomingCount: number;
  photosThisMonth: number;
  videosThisMonth: number;
  newVolunteers: number;
  unreadMessages: number;
  activity: ActivityEntry[];
  donationsThisMonth: { total: number; count: number };
}

export interface TrashEntry {
  type: string;
  typeName: string;
  id: string;
  label: string;
  thumb: string;
  deletedAt: string;
  purgeAt: string;
}
