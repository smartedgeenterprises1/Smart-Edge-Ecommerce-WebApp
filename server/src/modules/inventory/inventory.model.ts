import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const inventoryMovementSchema = new Schema(
  {
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true, index: true },
    type: {
      type: String,
      enum: ['adjustment', 'sale', 'cancel_restore', 'reservation', 'reservation_release', 'receive'],
      required: true,
    },
    quantityDelta: { type: Number, required: true },
    stockOnHandAfter: { type: Number, required: true },
    stockReservedAfter: { type: Number, required: true },
    reason: { type: String, required: true, maxlength: 300 },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    reservationId: { type: Schema.Types.ObjectId, ref: 'InventoryReservation' },
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export type InventoryMovementDocument = InferSchemaType<typeof inventoryMovementSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const InventoryMovement: Model<InventoryMovementDocument> =
  mongoose.models.InventoryMovement ||
  mongoose.model<InventoryMovementDocument>('InventoryMovement', inventoryMovementSchema);

const reservationItemSchema = new Schema(
  {
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const inventoryReservationSchema = new Schema(
  {
    checkoutKey: { type: String, required: true, unique: true, index: true },
    items: { type: [reservationItemSchema], required: true },
    status: { type: String, enum: ['active', 'consumed', 'released', 'expired'], default: 'active', index: true },
    expiresAt: { type: Date, required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    releasedAt: { type: Date },
  },
  { timestamps: true },
);

export type InventoryReservationDocument = InferSchemaType<typeof inventoryReservationSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const InventoryReservation: Model<InventoryReservationDocument> =
  mongoose.models.InventoryReservation ||
  mongoose.model<InventoryReservationDocument>('InventoryReservation', inventoryReservationSchema);
