import mongoose from 'mongoose';
import { AppError } from '../../lib/errors.js';
import { ProductVariant } from '../products/product.model.js';
import { InventoryMovement, InventoryReservation } from './inventory.model.js';
import { AuditLog } from '../settings/settings.model.js';

/**
 * Inventory policy:
 * - stockOnHand: physical units
 * - stockReserved: held for active checkout reservations / pending orders
 * - available = stockOnHand - stockReserved
 * - Checkout creates a short-lived reservation (atomic conditional update)
 * - Successful order consumes reservation (reserved → sold: decrement onHand + reserved)
 * - Cancellation restores stock exactly once (inventoryRestored flag on order)
 * - Expiry job releases reservations without relying on TTL alone
 * - Adjustments require a reason and write InventoryMovement + AuditLog
 */

export async function adjustStock(params: {
  variantId: string;
  delta: number;
  reason: string;
  actorUserId?: string;
  session?: mongoose.ClientSession;
}) {
  const { variantId, delta, reason, actorUserId, session } = params;
  const variant = await ProductVariant.findById(variantId).session(session ?? null);
  if (!variant) throw new AppError('Variant not found', 404, 'NOT_FOUND');

  const nextOnHand = variant.stockOnHand + delta;
  if (nextOnHand < 0) throw new AppError('Insufficient stock for adjustment', 400, 'INSUFFICIENT_STOCK');
  if (nextOnHand < variant.stockReserved) {
    throw new AppError('Cannot reduce on-hand below reserved quantity', 400, 'INVALID_ADJUSTMENT');
  }

  variant.stockOnHand = nextOnHand;
  await variant.save({ session: session ?? undefined });

  await InventoryMovement.create(
    [
      {
        variantId: variant._id,
        type: 'adjustment',
        quantityDelta: delta,
        stockOnHandAfter: variant.stockOnHand,
        stockReservedAfter: variant.stockReserved,
        reason,
        actorUserId,
      },
    ],
    { session: session ?? undefined },
  );

  if (actorUserId) {
    await AuditLog.create(
      [
        {
          actorUserId,
          action: 'inventory.adjust',
          entityType: 'ProductVariant',
          entityId: String(variant._id),
          after: { delta, reason, stockOnHand: variant.stockOnHand },
        },
      ],
      { session: session ?? undefined },
    );
  }

  return variant;
}

/** Atomically reserve stock for checkout. Prevents overselling under concurrency. */
export async function reserveStock(
  checkoutKey: string,
  items: Array<{ variantId: string; quantity: number }>,
  expiresAt: Date,
  session: mongoose.ClientSession | null,
) {
  const existing = await InventoryReservation.findOne({ checkoutKey }).session(session);
  if (existing && existing.status === 'active') {
    return existing;
  }
  if (existing && existing.status === 'consumed') {
    throw new AppError('Checkout key already used', 409, 'IDEMPOTENCY_CONFLICT');
  }

  for (const item of items) {
    const updated = await ProductVariant.findOneAndUpdate(
      {
        _id: item.variantId,
        isActive: true,
        $expr: { $gte: [{ $subtract: ['$stockOnHand', '$stockReserved'] }, item.quantity] },
      },
      { $inc: { stockReserved: item.quantity } },
      { new: true, session: session ?? undefined },
    );
    if (!updated) {
      throw new AppError(`Insufficient stock for variant ${item.variantId}`, 409, 'INSUFFICIENT_STOCK');
    }
    await InventoryMovement.create(
      [
        {
          variantId: updated._id,
          type: 'reservation',
          quantityDelta: item.quantity,
          stockOnHandAfter: updated.stockOnHand,
          stockReservedAfter: updated.stockReserved,
          reason: `Reserve for checkout ${checkoutKey}`,
        },
      ],
      session ? { session } : undefined,
    );
  }

  const created = await InventoryReservation.create(
    [
      {
        checkoutKey,
        items: items.map((i) => ({
          variantId: new mongoose.Types.ObjectId(i.variantId),
          quantity: i.quantity,
        })),
        status: 'active',
        expiresAt,
      },
    ],
    session ? { session } : undefined,
  );
  return Array.isArray(created) ? created[0] : created;
}

export async function consumeReservation(
  reservationId: mongoose.Types.ObjectId,
  orderId: mongoose.Types.ObjectId,
  session: mongoose.ClientSession | null,
) {
  const reservation = await InventoryReservation.findOneAndUpdate(
    { _id: reservationId, status: 'active' },
    { status: 'consumed', orderId },
    { new: true, session: session ?? undefined },
  );
  if (!reservation) throw new AppError('Reservation not active', 409, 'RESERVATION_INVALID');

  for (const item of reservation.items) {
    const updated = await ProductVariant.findOneAndUpdate(
      {
        _id: item.variantId,
        stockReserved: { $gte: item.quantity },
        stockOnHand: { $gte: item.quantity },
      },
      { $inc: { stockOnHand: -item.quantity, stockReserved: -item.quantity } },
      { new: true, session: session ?? undefined },
    );
    if (!updated) throw new AppError('Failed to consume reserved stock', 409, 'INVENTORY_ERROR');
    await InventoryMovement.create(
      [
        {
          variantId: item.variantId,
          type: 'sale',
          quantityDelta: -item.quantity,
          stockOnHandAfter: updated.stockOnHand,
          stockReservedAfter: updated.stockReserved,
          reason: 'Order sale',
          orderId,
          reservationId,
        },
      ],
      session ? { session } : undefined,
    );
  }
  return reservation;
}

export async function releaseReservation(
  reservationId: mongoose.Types.ObjectId,
  reason: string,
  session?: mongoose.ClientSession,
) {
  const reservation = await InventoryReservation.findOne({ _id: reservationId }).session(session ?? null);
  if (!reservation) return null;
  if (reservation.status !== 'active') return reservation;

  for (const item of reservation.items) {
    const updated = await ProductVariant.findOneAndUpdate(
      { _id: item.variantId, stockReserved: { $gte: item.quantity } },
      { $inc: { stockReserved: -item.quantity } },
      { new: true, session: session ?? undefined },
    );
    if (updated) {
      await InventoryMovement.create(
        [
          {
            variantId: item.variantId,
            type: 'reservation_release',
            quantityDelta: -item.quantity,
            stockOnHandAfter: updated.stockOnHand,
            stockReservedAfter: updated.stockReserved,
            reason,
            reservationId,
          },
        ],
        { session: session ?? undefined },
      );
    }
  }

  reservation.status = reason.includes('expir') ? 'expired' : 'released';
  reservation.releasedAt = new Date();
  await reservation.save({ session: session ?? undefined });
  return reservation;
}

/** Restore sold stock on cancellation — exactly once. */
export async function restoreStockForOrder(
  orderId: mongoose.Types.ObjectId,
  items: Array<{ variantId: mongoose.Types.ObjectId; quantity: number }>,
  session: mongoose.ClientSession | null,
) {
  for (const item of items) {
    const updated = await ProductVariant.findOneAndUpdate(
      { _id: item.variantId },
      { $inc: { stockOnHand: item.quantity } },
      { new: true, session: session ?? undefined },
    );
    if (!updated) continue;
    await InventoryMovement.create(
      [
        {
          variantId: item.variantId,
          type: 'cancel_restore',
          quantityDelta: item.quantity,
          stockOnHandAfter: updated.stockOnHand,
          stockReservedAfter: updated.stockReserved,
          reason: 'Order cancelled — restore stock',
          orderId,
        },
      ],
      session ? { session } : undefined,
    );
  }
}

export async function expireActiveReservations() {
  const now = new Date();
  const expired = await InventoryReservation.find({ status: 'active', expiresAt: { $lte: now } }).limit(100);
  for (const reservation of expired) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      await releaseReservation(reservation._id, 'Reservation expired', session);
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      console.error('[inventory] failed to expire reservation', reservation._id, err);
    } finally {
      session.endSession();
    }
  }
  return expired.length;
}
