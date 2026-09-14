import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { AppError } from './errors.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

let cloudinaryReady = false;

function ensureCloudinaryConfigured() {
  if (cloudinaryReady) return;
  if (env.CLOUDINARY_URL) {
    process.env.CLOUDINARY_URL = env.CLOUDINARY_URL;
    cloudinary.config();
  } else if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  } else {
    throw new AppError(
      'Cloudinary is not configured. Set CLOUDINARY_URL or cloud name/key/secret.',
      500,
      'STORAGE_MISCONFIGURED',
    );
  }
  cloudinaryReady = true;
}

export async function ensureUploadDir(): Promise<string | null> {
  if (env.STORAGE_DRIVER !== 'local') return null;
  const dir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

async function processImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

async function saveLocal(processed: Buffer): Promise<{ url: string; key: string }> {
  const dir = await ensureUploadDir();
  if (!dir) throw new AppError('Local upload directory unavailable.', 500, 'STORAGE_MISCONFIGURED');
  const key = `${randomUUID()}.webp`;
  await fs.writeFile(path.join(dir, key), processed);
  return {
    key,
    url: `${env.PUBLIC_API_URL}/uploads/${key}`,
  };
}

async function saveCloudinary(processed: Buffer): Promise<{ url: string; key: string }> {
  ensureCloudinaryConfigured();
  const uploaded = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'smart-edge',
        resource_type: 'image',
        format: 'webp',
      },
      (err, result) => {
        if (err || !result?.secure_url || !result.public_id) {
          reject(err || new Error('Cloudinary upload failed'));
          return;
        }
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      },
    );
    stream.end(processed);
  });

  return {
    key: uploaded.public_id,
    url: uploaded.secure_url,
  };
}

export async function saveProductImage(buffer: Buffer, mimeType: string): Promise<{ url: string; key: string }> {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new AppError('Unsupported image type. Use JPEG, PNG, WebP, or GIF.', 400, 'INVALID_UPLOAD');
  }
  if (buffer.length > 5 * 1024 * 1024) {
    throw new AppError('Image must be 5MB or smaller.', 400, 'INVALID_UPLOAD');
  }

  const processed = await processImage(buffer);

  if (env.STORAGE_DRIVER === 'cloudinary') {
    return saveCloudinary(processed);
  }
  return saveLocal(processed);
}
