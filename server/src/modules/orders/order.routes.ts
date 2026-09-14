import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { ok } from '../../lib/api-response.js';
import { asyncHandler, validateBody } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';
import { Order } from './order.model.js';
import {
  checkout,
  checkoutSchema,
  getGuestOrder,
  quoteCart,
  quoteSchema,
} from './order.service.js';

const checkoutLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.CHECKOUT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
});

export const cartRouter = Router();

cartRouter.post(
  '/quote',
  validateBody(quoteSchema),
  asyncHandler(async (req, res) => {
    const quote = await quoteCart(req.body, req.user?.email);
    ok(res, quote);
  }),
);

cartRouter.post(
  '/checkout',
  checkoutLimiter,
  validateBody(checkoutSchema),
  asyncHandler(async (req, res) => {
    const result = await checkout(req.body, req.user ? String(req.user._id) : undefined);
    ok(
      res,
      {
        order: {
          id: result.order._id,
          orderNumber: result.order.orderNumber,
          totalMinor: result.order.totalMinor,
          currency: result.order.currency,
          paymentStatus: result.order.paymentStatus,
          fulfillmentStatus: result.order.fulfillmentStatus,
          items: result.order.items,
          shippingAddress: result.order.shippingAddress,
          subtotalMinor: result.order.subtotalMinor,
          discountMinor: result.order.discountMinor,
          shippingMinor: result.order.shippingMinor,
          createdAt: result.order.createdAt,
        },
        replayed: result.replayed,
        guestAccessToken: result.guestAccessToken,
      },
      result.replayed ? 200 : 201,
    );
  }),
);

export const orderRouter = Router();

orderRouter.get(
  '/mine',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ userId: req.user!._id }).sort({ createdAt: -1 }).limit(50).lean();
    ok(res, orders);
  }),
);

orderRouter.get(
  '/mine/:orderNumber',
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber, userId: req.user!._id }).lean();
    if (!order) {
      res.status(404).json({ success: false, error: { message: 'Order not found', code: 'NOT_FOUND' } });
      return;
    }
    ok(res, order);
  }),
);

orderRouter.post(
  '/guest-lookup',
  validateBody(
    z.object({
      orderNumber: z.string().min(3),
      accessToken: z.string().min(20),
    }),
  ),
  asyncHandler(async (req, res) => {
    const order = await getGuestOrder(req.body.orderNumber, req.body.accessToken);
    ok(res, order);
  }),
);
