import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['percent', 'fixed'], required: true },
    /** percent: 0-100; fixed: minor units */
    value: { type: Number, required: true, min: 0 },
    minSubtotalMinor: { type: Number, default: 0, min: 0 },
    maxDiscountMinor: { type: Number, min: 0 },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    usageLimit: { type: Number, min: 0 },
    usageCount: { type: Number, default: 0, min: 0 },
    perCustomerLimit: { type: Number, min: 0, default: 1 },
    isActive: { type: Boolean, default: true },
    eligibleCategoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    eligibleBrandIds: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],
  },
  { timestamps: true },
);

export type CouponDocument = InferSchemaType<typeof couponSchema> & { _id: mongoose.Types.ObjectId };
export const Coupon: Model<CouponDocument> =
  mongoose.models.Coupon || mongoose.model<CouponDocument>('Coupon', couponSchema);

const couponRedemptionSchema = new Schema(
  {
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    customerEmail: { type: String, required: true, lowercase: true, index: true },
    discountMinor: { type: Number, required: true },
  },
  { timestamps: true },
);

couponRedemptionSchema.index({ couponId: 1, customerEmail: 1 });

export type CouponRedemptionDocument = InferSchemaType<typeof couponRedemptionSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const CouponRedemption: Model<CouponRedemptionDocument> =
  mongoose.models.CouponRedemption ||
  mongoose.model<CouponRedemptionDocument>('CouponRedemption', couponRedemptionSchema);
