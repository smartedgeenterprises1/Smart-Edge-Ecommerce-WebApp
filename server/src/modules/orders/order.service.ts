import mongoose from 'mongoose';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError } from '../../lib/errors.js';
import { generateToken, hashToken } from '../../lib/utils.js';
import { getPaymentAdapter } from '../../lib/payments.js';
import { Product, ProductVariant } from '../products/product.model.js';
import { DeviceModel, Brand } from '../brands/brand.model.js';
import { Coupon, CouponRedemption } from '../coupons/coupon.model.js';
import { Order } from './order.model.js';
import { StoreSettings } from '../settings/settings.model.js';
import { withTransaction } from '../../lib/mongo-tx.js';
import {
  consumeReservation,
  releaseReservation,
  reserveStock,
  restoreStockForOrder,
} from '../inventory/inventory.service.js';

export const cartItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

export const quoteSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
  couponCode: z.string().max(40).optional(),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(50),
  couponCode: z.string().max(40).optional(),
  paymentMethod: z.literal('cod'),
  idempotencyKey: z.string().min(16).max(100),
  customer: z.object({
    fullName: z.string().min(2).max(120),
    email: z.string().email().max(200),
    phone: z.string().min(7).max(30),
  }),
  shippingAddress: z.object({
    street: z.string().min(3).max(200),
    city: z.string().min(2).max(100),
    province: z.string().min(2).max(100),
    postalCode: z.string().max(20).optional().default(''),
    country: z.string().length(2).default('PK'),
  }),
  notes: z.string().max(500).optional().default(''),
});

async function getSettings() {
  let settings = await StoreSettings.findOne({ key: 'default' });
  if (!settings) {
    settings = await StoreSettings.create({ key: 'default' });
  }
  return settings;
}

export async function validateAndPriceItems(items: Array<{ variantId: string; quantity: number }>) {
  const priced = [];
  for (const item of items) {
    const variant = await ProductVariant.findById(item.variantId);
    if (!variant || !variant.isActive) {
      throw new AppError(`Variant unavailable: ${item.variantId}`, 400, 'VARIANT_UNAVAILABLE');
    }
    const product = await Product.findById(variant.productId);
    if (!product || product.status !== 'active') {
      throw new AppError('Product is not available', 400, 'PRODUCT_UNAVAILABLE');
    }
    const device = variant.deviceModelId ? await DeviceModel.findById(variant.deviceModelId) : null;
    const brand = device ? await Brand.findById(device.brandId) : null;
    if (variant.deviceModelId && (!device || !brand)) {
      throw new AppError('Device model missing for variant', 400, 'INVALID_VARIANT');
    }

    const available = variant.stockOnHand - variant.stockReserved;
    const deviceLabel = device?.name ?? 'Universal';
    if (available < item.quantity) {
      throw new AppError(
        `Only ${available} available for ${product.title} (${variant.color} / ${deviceLabel})`,
        409,
        'INSUFFICIENT_STOCK',
        { variantId: item.variantId, available },
      );
    }

    const image =
      variant.images?.[0]?.url ||
      product.images?.[0]?.url ||
      '';

    priced.push({
      product,
      variant,
      device,
      brand,
      quantity: item.quantity,
      unitPriceMinor: variant.priceMinor,
      lineTotalMinor: variant.priceMinor * item.quantity,
      imageUrl: image,
      available,
    });
  }
  return priced;
}

export async function applyCoupon(
  code: string | undefined,
  subtotalMinor: number,
  customerEmail?: string,
) {
  if (!code) return { discountMinor: 0, coupon: null as null | InstanceType<typeof Coupon> };
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) throw new AppError('Invalid coupon code', 400, 'INVALID_COUPON');
  const now = new Date();
  if (now < coupon.startsAt || now > coupon.endsAt) {
    throw new AppError('Coupon is not active at this time', 400, 'COUPON_INACTIVE');
  }
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError('Coupon usage limit reached', 400, 'COUPON_EXHAUSTED');
  }
  if (subtotalMinor < coupon.minSubtotalMinor) {
    throw new AppError('Order does not meet coupon minimum spend', 400, 'COUPON_MIN_SPEND');
  }
  if (customerEmail && coupon.perCustomerLimit) {
    const used = await CouponRedemption.countDocuments({
      couponId: coupon._id,
      customerEmail: customerEmail.toLowerCase(),
    });
    if (used >= coupon.perCustomerLimit) {
      throw new AppError('You have already used this coupon', 400, 'COUPON_CUSTOMER_LIMIT');
    }
  }

  let discount =
    coupon.type === 'percent'
      ? Math.floor((subtotalMinor * coupon.value) / 100)
      : Math.min(coupon.value, subtotalMinor);
  if (coupon.maxDiscountMinor != null) discount = Math.min(discount, coupon.maxDiscountMinor);
  return { discountMinor: discount, coupon };
}

export async function quoteCart(input: z.infer<typeof quoteSchema>, customerEmail?: string) {
  const priced = await validateAndPriceItems(input.items);
  const subtotalMinor = priced.reduce((sum, i) => sum + i.lineTotalMinor, 0);
  const { discountMinor, coupon } = await applyCoupon(input.couponCode, subtotalMinor, customerEmail);
  const settings = await getSettings();
  const afterDiscount = Math.max(0, subtotalMinor - discountMinor);
  const shippingMinor =
    settings.freeShippingThresholdMinor > 0 && afterDiscount >= settings.freeShippingThresholdMinor
      ? 0
      : settings.shippingFlatMinor;
  const taxMinor = 0;
  const totalMinor = afterDiscount + shippingMinor + taxMinor;

  return {
    items: priced.map((i) => ({
      variantId: String(i.variant._id),
      productId: String(i.product._id),
      title: i.product.title,
      slug: i.product.slug,
      sku: i.variant.sku,
      color: i.variant.color,
      colorHex: i.variant.colorHex,
      deviceBrandName: i.brand?.name ?? '',
      deviceModelName: i.device?.name ?? 'Universal',
      deviceModelId: i.device ? String(i.device._id) : '',
      imageUrl: i.imageUrl,
      unitPriceMinor: i.unitPriceMinor,
      compareAtPriceMinor: i.variant.compareAtPriceMinor,
      quantity: i.quantity,
      lineTotalMinor: i.lineTotalMinor,
      available: i.available,
    })),
    currency: settings.currency,
    subtotalMinor,
    discountMinor,
    shippingMinor,
    taxMinor,
    totalMinor,
    couponCode: coupon?.code ?? '',
    priceChanged: false,
  };
}

async function nextOrderNumber(session: mongoose.ClientSession | null) {
  const count = await Order.countDocuments().session(session);
  const seq = String(count + 1).padStart(6, '0');
  return `SE-${new Date().getFullYear()}-${seq}`;
}

export async function checkout(
  input: z.infer<typeof checkoutSchema>,
  userId?: string,
) {
  const existing = await Order.findOne({ idempotencyKey: input.idempotencyKey });
  if (existing) {
    return { order: existing, replayed: true, guestAccessToken: null as string | null };
  }

  return withTransaction(async (session) => {
    const priced = await validateAndPriceItems(input.items);
    const subtotalMinor = priced.reduce((sum, i) => sum + i.lineTotalMinor, 0);
    const { discountMinor, coupon } = await applyCoupon(
      input.couponCode,
      subtotalMinor,
      input.customer.email,
    );
    const settings = await getSettings();
    const afterDiscount = Math.max(0, subtotalMinor - discountMinor);
    const shippingMinor =
      settings.freeShippingThresholdMinor > 0 && afterDiscount >= settings.freeShippingThresholdMinor
        ? 0
        : settings.shippingFlatMinor;
    const taxMinor = 0;
    const totalMinor = afterDiscount + shippingMinor + taxMinor;

    const expiresAt = new Date(Date.now() + env.CART_RESERVATION_MINUTES * 60 * 1000);
    const reservation = await reserveStock(
      input.idempotencyKey,
      input.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      expiresAt,
      session,
    );

    const guestAccessToken = userId ? null : generateToken(32);
    const orderNumber = await nextOrderNumber(session);

    const created = await Order.create(
      [
        {
          orderNumber,
          userId: userId || undefined,
          guestAccessTokenHash: guestAccessToken ? hashToken(guestAccessToken) : undefined,
          customerEmail: input.customer.email.toLowerCase(),
          customerPhone: input.customer.phone,
          customerName: input.customer.fullName,
          items: priced.map((i) => ({
            productId: i.product._id,
            variantId: i.variant._id,
            title: i.product.title,
            sku: i.variant.sku,
            color: i.variant.color,
            deviceBrandName: i.brand?.name ?? '',
            deviceModelName: i.device?.name ?? 'Universal',
            deviceModelId: i.device?._id,
            imageUrl: i.imageUrl,
            unitPriceMinor: i.unitPriceMinor,
            quantity: i.quantity,
            lineDiscountMinor: 0,
            lineTotalMinor: i.lineTotalMinor,
          })),
          shippingAddress: {
            fullName: input.customer.fullName,
            phone: input.customer.phone,
            email: input.customer.email.toLowerCase(),
            street: input.shippingAddress.street,
            city: input.shippingAddress.city,
            province: input.shippingAddress.province,
            postalCode: input.shippingAddress.postalCode ?? '',
            country: input.shippingAddress.country ?? 'PK',
          },
          notes: input.notes ?? '',
          currency: settings.currency,
          subtotalMinor,
          discountMinor,
          shippingMinor,
          taxMinor,
          totalMinor,
          couponCode: coupon?.code ?? '',
          couponId: coupon?._id,
          paymentMethod: 'cod',
          paymentStatus: 'pending',
          fulfillmentStatus: 'pending',
          idempotencyKey: input.idempotencyKey,
        },
      ],
      session ? { session } : undefined,
    );
    const order = Array.isArray(created) ? created[0] : created;

    await consumeReservation(reservation._id, order._id, session);

    const payment = await getPaymentAdapter('cod').charge({
      orderId: String(order._id),
      amountMinor: totalMinor,
      currency: settings.currency,
      method: 'cod',
    });
    order.paymentStatus =
      payment.status === 'captured' || payment.status === 'authorized'
        ? 'authorized'
        : payment.status === 'failed'
          ? 'failed'
          : 'pending';
    await order.save({ session: session ?? undefined });

    if (coupon) {
      const redeemed = await Coupon.findOneAndUpdate(
        {
          _id: coupon._id,
          $or: [{ usageLimit: null }, { usageLimit: { $exists: false } }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }],
        },
        { $inc: { usageCount: 1 } },
        { session: session ?? undefined, new: true },
      );
      if (!redeemed) throw new AppError('Coupon no longer available', 400, 'COUPON_EXHAUSTED');
      await CouponRedemption.create(
        [
          {
            couponId: coupon._id,
            orderId: order._id,
            userId: userId || undefined,
            customerEmail: input.customer.email.toLowerCase(),
            discountMinor,
          },
        ],
        session ? { session } : undefined,
      );
    }

    for (const i of priced) {
      await Product.findByIdAndUpdate(i.product._id, { $inc: { salesCount: i.quantity } }, {
        session: session ?? undefined,
      });
    }

    return { order, replayed: false, guestAccessToken };
  });
}

const FULFILLMENT_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export async function updateFulfillmentStatus(
  orderId: string,
  nextStatus: string,
  actorUserId: string,
  tracking?: { trackingNumber?: string; trackingCarrier?: string },
) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  const allowed = FULFILLMENT_TRANSITIONS[order.fulfillmentStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(
      `Cannot transition from ${order.fulfillmentStatus} to ${nextStatus}`,
      400,
      'INVALID_TRANSITION',
    );
  }

  if (nextStatus === 'cancelled') {
    return cancelOrder(orderId, actorUserId);
  }

  order.fulfillmentStatus = nextStatus as typeof order.fulfillmentStatus;
  if (nextStatus === 'shipped') {
    order.shippedAt = new Date();
  }
  if (tracking?.trackingNumber !== undefined) {
    order.trackingNumber = tracking.trackingNumber;
  }
  if (tracking?.trackingCarrier !== undefined) {
    order.trackingCarrier = tracking.trackingCarrier;
  }
  if (nextStatus === 'delivered') order.deliveredAt = new Date();
  order.internalNotes.push({
    message: `Fulfillment → ${nextStatus}`,
    at: new Date(),
    by: new mongoose.Types.ObjectId(actorUserId),
  });
  await order.save();
  return order;
}

export async function updateOrderTracking(
  orderId: string,
  tracking: { trackingNumber?: string; trackingCarrier?: string },
  actorUserId: string,
) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  if (order.fulfillmentStatus === 'cancelled') {
    throw new AppError('Cannot update tracking on cancelled order', 400, 'INVALID_STATE');
  }
  if (tracking.trackingNumber !== undefined) order.trackingNumber = tracking.trackingNumber;
  if (tracking.trackingCarrier !== undefined) order.trackingCarrier = tracking.trackingCarrier;
  order.internalNotes.push({
    message: `Tracking updated${tracking.trackingNumber ? `: ${tracking.trackingNumber}` : ''}`,
    at: new Date(),
    by: new mongoose.Types.ObjectId(actorUserId),
  });
  await order.save();
  return order;
}

export async function markPaymentCollected(orderId: string, actorUserId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
  if (order.fulfillmentStatus === 'cancelled') {
    throw new AppError('Cannot collect payment for cancelled order', 400, 'INVALID_STATE');
  }
  if (order.paymentStatus === 'collected') return order;
  order.paymentStatus = 'collected';
  order.paymentCollectedAt = new Date();
  order.internalNotes.push({
    message: 'COD payment collected',
    at: new Date(),
    by: new mongoose.Types.ObjectId(actorUserId),
  });
  await order.save();
  return order;
}

export async function cancelOrder(orderId: string, actorUserId?: string) {
  return withTransaction(async (session) => {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new AppError('Order not found', 404, 'NOT_FOUND');
    if (order.fulfillmentStatus === 'cancelled') return order;
    if (['shipped', 'delivered'].includes(order.fulfillmentStatus)) {
      throw new AppError('Cannot cancel shipped/delivered orders', 400, 'INVALID_STATE');
    }

    order.fulfillmentStatus = 'cancelled';
    order.cancelledAt = new Date();
    if (actorUserId) {
      order.internalNotes.push({
        message: 'Order cancelled',
        at: new Date(),
        by: new mongoose.Types.ObjectId(actorUserId),
      });
    }

    if (!order.inventoryRestored) {
      await restoreStockForOrder(
        order._id,
        order.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        session,
      );
      order.inventoryRestored = true;
    }

    await order.save({ session: session ?? undefined });
    return order;
  });
}

export async function getGuestOrder(orderNumber: string, accessToken: string) {
  const order = await Order.findOne({ orderNumber }).select('+guestAccessTokenHash');
  if (!order || !order.guestAccessTokenHash) throw new AppError('Order not found', 404, 'NOT_FOUND');
  if (order.guestAccessTokenHash !== hashToken(accessToken)) {
    throw new AppError('Invalid access token', 403, 'FORBIDDEN');
  }
  return order;
}

export { releaseReservation };
