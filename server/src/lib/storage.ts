import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { AppError } from './errors.js';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function ensureUploadDir(): Promise<string> {
  const dir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function saveProductImage(buffer: Buffer, mimeType: string): Promise<{ url: string; key: string }> {
  if (!ALLOWED_MIME.has(mimeType)) {
    throw new AppError('Unsupported image type. Use JPEG, PNG, WebP, or GIF.', 400, 'INVALID_UPLOAD');
  }
  if (buffer.length > 5 * 1024 * 1024) {
    throw new AppError('Image must be 5MB or smaller.', 400, 'INVALID_UPLOAD');
  }

  const dir = await ensureUploadDir();
  const key = `${randomUUID()}.webp`;
  const outPath = path.join(dir, key);
  await sharp(buffer)
    .rotate()
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(outPath);

  return {
    key,
    url: `${env.PUBLIC_API_URL}/uploads/${key}`,
  };
}
