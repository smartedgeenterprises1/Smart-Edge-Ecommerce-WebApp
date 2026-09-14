import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

export interface MailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(payload: MailPayload): Promise<{ delivered: boolean; previewPath?: string }> {
  if (env.EMAIL_DRIVER === 'preview' || !env.SMTP_HOST) {
    const dir = path.resolve(process.cwd(), 'mail-preview');
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, `${Date.now()}-${payload.to.replace(/[^a-z0-9@._-]/gi, '_')}.txt`);
    const body = [
      `To: ${payload.to}`,
      `Subject: ${payload.subject}`,
      `From: ${env.EMAIL_FROM}`,
      '',
      payload.text,
      '',
      payload.html ?? '',
    ].join('\n');
    await fs.writeFile(file, body, 'utf8');
    return { delivered: false, previewPath: file };
  }

  // SMTP adapter placeholder — configure nodemailer or similar in production.
  // Intentionally not claiming delivery without a configured provider.
  throw new Error('SMTP email driver is not fully configured. Set EMAIL_DRIVER=preview for local development.');
}
