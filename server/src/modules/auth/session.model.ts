import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
    revokedAt: { type: Date },
  },
  { timestamps: true },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionDocument = InferSchemaType<typeof sessionSchema> & { _id: mongoose.Types.ObjectId };
export const Session: Model<SessionDocument> =
  mongoose.models.Session || mongoose.model<SessionDocument>('Session', sessionSchema);

const passwordResetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true },
);

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetDocument = InferSchemaType<typeof passwordResetSchema> & {
  _id: mongoose.Types.ObjectId;
};
export const PasswordReset: Model<PasswordResetDocument> =
  mongoose.models.PasswordReset ||
  mongoose.model<PasswordResetDocument>('PasswordReset', passwordResetSchema);
