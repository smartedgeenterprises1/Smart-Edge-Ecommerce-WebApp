import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    title: { type: String, required: true },
    sku: { type: String, required: true },
    color: { type: String, required: true },
    deviceBrandName: { type: String, default: '' },
    deviceModelName: { type: String, default: 'Universal' },
    deviceModelId: { type: Schema.Types.ObjectId, ref: 'DeviceModel' },
    imageUrl: { type: String, default: '' },
    unitPriceMinor: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineDiscountMinor: { type: Number, default: 0, min: 0 },
    lineTotalMinor: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const addressSnapshotSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    province: { type: String, required: true },
    postalCode: { type: String, default: '' },
    country: { type: String, required: true, default: 'PK' },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    guestAccessTokenHash: { type: String, select: false, index: true },
    customerEmail: { type: String, required: true, lowercase: true, index: true },
    customerPhone: { type: String, required: true },
    customerName: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: addressSnapshotSchema, required: true },
    notes: { type: String, default: '', maxlength: 500 },
    currency: { type: String, required: true, default: 'PKR' },
    subtotalMinor: { type: Number, required: true, min: 0 },
    discountMinor: { type: Number, default: 0, min: 0 },
    shippingMinor: { type: Number, required: true, min: 0 },
    taxMinor: { type: Number, default: 0, min: 0 },
    totalMinor: { type: Number, required: true, min: 0 },
    couponCode: { type: String, default: '' },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    paymentMethod: { type: String, enum: ['cod'], required: true, default: 'cod' },
    paymentStatus: {
      type: String,
      enum: ['pending', 'authorized', 'collected', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    trackingNumber: { type: String, default: '' },
    trackingCarrier: { type: String, default: '' },
    internalNotes: [{ message: String, at: Date, by: { type: Schema.Types.ObjectId, ref: 'User' } }],
    idempotencyKey: { type: String, unique: true, sparse: true, index: true },
    inventoryRestored: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    paymentCollectedAt: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ fulfillmentStatus: 1, paymentStatus: 1, createdAt: -1 });

export type OrderDocument = InferSchemaType<typeof orderSchema> & { _id: mongoose.Types.ObjectId };
export const Order: Model<OrderDocument> =
  mongoose.models.Order || mongoose.model<OrderDocument>('Order', orderSchema);
