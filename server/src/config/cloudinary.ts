import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

if (env.cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export { cloudinary };

export const UPLOAD_FOLDERS = [
  'rise/events',
  'rise/gallery',
  'rise/homepage',
  'rise/programs',
  'rise/testimonials',
  'rise/media',
] as const;
