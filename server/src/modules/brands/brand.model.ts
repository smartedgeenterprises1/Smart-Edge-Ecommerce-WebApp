import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const brandSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    deviceFamilyLabel: { type: String, required: true, trim: true }, // e.g. iPhone, Pixel, Galaxy
    description: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
  },
  { timestamps: true },
);

export type BrandDocument = InferSchemaType<typeof brandSchema> & { _id: mongoose.Types.ObjectId };
export const Brand: Model<BrandDocument> =
  mongoose.models.Brand || mongoose.model<BrandDocument>('Brand', brandSchema);

const deviceModelSchema = new Schema(
  {
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    series: { type: String, default: '', trim: true },
    releaseYear: { type: Number },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
  },
  { timestamps: true },
);

deviceModelSchema.index({ brandId: 1, name: 1 }, { unique: true });

export type DeviceModelDocument = InferSchemaType<typeof deviceModelSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const DeviceModel: Model<DeviceModelDocument> =
  mongoose.models.DeviceModel || mongoose.model<DeviceModelDocument>('DeviceModel', deviceModelSchema);
