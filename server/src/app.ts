import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env.js';
import { loadSession } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { catalogRouter } from './modules/products/catalog.routes.js';
import { cartRouter, orderRouter } from './modules/orders/order.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { accountRouter, settingsPublicRouter } from './modules/users/account.routes.js';
import { ensureUploadDir } from './lib/storage.js';

export async function createApp() {
  await ensureUploadDir();
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Idempotency-Key', 'X-CSRF-Token'],
    }),
  );
  app.use(compression());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(cookieParser());
  app.use(loadSession);

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'smart-edge-api', store: env.STORE_NAME });
  });

  if (env.STORAGE_DRIVER === 'local') {
    app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), { maxAge: '7d' }));
  }
  app.use('/api/auth', authRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/orders', orderRouter);
  app.use('/api/account', accountRouter);
  app.use('/api/settings', settingsPublicRouter);
  app.use('/api/admin', adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
