// src/lib/cloudinary.ts
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env.js';
import { AppError } from './AppError.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

const FOLDER = 'dental-clinic';
const URL_PREFIX = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/`;

export function uploadImage(buffer: Buffer): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: FOLDER,
          resource_type: 'image',
          allowed_formats: ['jpg', 'png', 'webp'],
          // cap stored size so huge phone photos don't eat storage
          transformation: [{ width: 1600, height: 1600, crop: 'limit' }],
        },
        (err, result) => {
          if (err || !result) {
            console.error('Cloudinary upload failed:', err);
            return reject(new AppError(502, 'Image upload failed, please try again'));
          }
          resolve(result);
        },
      )
      .end(buffer);
  });
}

/** Extracts the public_id from a URL we generated, or null if it isn't one of ours */
export function publicIdFromUrl(url: string): string | null {
  if (!url.startsWith(URL_PREFIX)) return null;
  
const [withoutQuery = ''] = url.slice(URL_PREFIX.length).split('?');
  const path = withoutQuery.replace(/^v\d+\//, '');
  const publicId = path.replace(/\.[a-z0-9]+$/i, '');

  return publicId.startsWith(`${FOLDER}/`) ? publicId : null;
}

export async function deleteImage(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}