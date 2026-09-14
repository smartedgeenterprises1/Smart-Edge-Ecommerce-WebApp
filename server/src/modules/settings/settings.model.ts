import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const storeSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'default' },
    storeName: { type: String, default: 'SMART EDGE' },
    tagline: { type: String, default: 'Premium covers for the phones you use.' },
    announcement: { type: String, default: '' },
    /** Full-bleed homepage hero image (set from admin uploads). */
    heroImageUrl: { type: String, default: '' },
    contactEmail: { type: String, default: 'hello@smartedge.local' },
    contactPhone: { type: String, default: '+92 300 0000000' },
    contactAddress: { type: String, default: 'Pakistan' },
    socialLinks: {
      instagram: { type: String, default: '' },
      facebook: { type: String, default: '' },
      whatsapp: { type: String, default: '' },
    },
    currency: { type: String, default: 'PKR' },
    country: { type: String, default: 'PK' },
    shippingFlatMinor: { type: Number, default: 25000 }, // PKR 250
    freeShippingThresholdMinor: { type: Number, default: 500000 }, // PKR 5,000
    lowStockThreshold: { type: Number, default: 5 },
    featuredProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    serviceClaims: [{ type: String }], // only configured accurate claims
    policies: {
      shipping: { type: String, default: '' },
      returns: { type: String, default: '' },
      privacy: { type: String, default: '' },
      terms: { type: String, default: '' },
      faq: { type: String, default: '' },
      about: { type: String, default: '' },
      draftDisclaimer: {
        type: String,
        default: 'DRAFT — Review and confirm with store owner before launch.',
      },
      policiesAreDraft: { type: Boolean, default: true },
    },
    seoDefaults: {
      titleSuffix: { type: String, default: 'SMART EDGE' },
      defaultDescription: {
        type: String,
        default: 'Shop premium mobile phone covers for Apple iPhone, Google Pixel, and Samsung Galaxy in Pakistan.',
      },
    },
  },
  { timestamps: true },
);

export type StoreSettingsDocument = InferSchemaType<typeof storeSettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const StoreSettings: Model<StoreSettingsDocument> =
  mongoose.models.StoreSettings ||
  mongoose.model<StoreSettingsDocument>('StoreSettings', storeSettingsSchema);

const auditLogSchema = new Schema(
  {
    actorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ip: { type: String, default: '' },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const AuditLog: Model<AuditLogDocument> =
  mongoose.models.AuditLog || mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);
