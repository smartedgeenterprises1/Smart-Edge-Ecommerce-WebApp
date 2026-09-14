import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, default: '' },
    features: [{ type: String }],
    materials: [{ type: String }],
    careInstructions: { type: String, default: '' },
    categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],
    brandIds: [{ type: Schema.Types.ObjectId, ref: 'Brand', index: true }],
    /** Compatible device models for this listing (covers span models via variants). */
    compatibleDeviceModelIds: [{ type: Schema.Types.ObjectId, ref: 'DeviceModel', index: true }],
    caseType: { type: String, default: '', index: true },
    material: { type: String, default: '', index: true },
    compatibilityFeatures: [{ type: String }],
    images: { type: [imageSchema], default: [] },
    status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft', index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    isNewArrival: { type: Boolean, default: false, index: true },
    basePriceMinor: { type: Number, required: true, min: 0 },
    compareAtPriceMinor: { type: Number, min: 0 },
    salesCount: { type: Number, default: 0, min: 0 },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    publishedAt: { type: Date },
  },
  { timestamps: true },
);

productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ status: 1, isFeatured: 1, publishedAt: -1 });
productSchema.index({ status: 1, categoryIds: 1 });
productSchema.index({ status: 1, compatibleDeviceModelIds: 1 });

export type ProductDocument = InferSchemaType<typeof productSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const Product: Model<ProductDocument> =
  mongoose.models.Product || mongoose.model<ProductDocument>('Product', productSchema);

const variantSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    /** Exact device model this sellable unit fits. Required for phone covers; optional for generic accessories. */
    deviceModelId: { type: Schema.Types.ObjectId, ref: 'DeviceModel', index: true },
    color: { type: String, required: true, trim: true, index: true },
    colorHex: { type: String, default: '#CCCCCC' },
    options: {
      type: Map,
      of: String,
      default: {},
    },
    priceMinor: { type: Number, required: true, min: 0 },
    compareAtPriceMinor: { type: Number, min: 0 },
    stockOnHand: { type: Number, required: true, min: 0, default: 0 },
    stockReserved: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    images: { type: [imageSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

variantSchema.virtual('availableStock').get(function (this: { stockOnHand: number; stockReserved: number }) {
  return Math.max(0, this.stockOnHand - this.stockReserved);
});

variantSchema.index({ productId: 1, deviceModelId: 1, color: 1 }, { unique: true });
variantSchema.index({ stockOnHand: 1, stockReserved: 1 });

export type ProductVariantDocument = InferSchemaType<typeof variantSchema> & {
  _id: mongoose.Types.ObjectId;
  availableStock?: number;
};
export const ProductVariant: Model<ProductVariantDocument> =
  mongoose.models.ProductVariant ||
  mongoose.model<ProductVariantDocument>('ProductVariant', variantSchema);
