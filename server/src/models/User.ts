import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const ROLES = ['owner', 'editor'] as const;
export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
    passwordHash: { type: String, default: '' },
    role: { type: String, enum: ROLES, default: 'editor' },
    active: { type: Boolean, default: true },
    tokenHash: { type: String, default: '' },
    tokenExpires: { type: Date },
    tokenPurpose: { type: String, enum: ['reset', 'invite', ''], default: '' },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

userSchema.set('toJSON', {
  transform: (_doc, ret: Record<string, unknown>) => {
    ret.pending = !ret.passwordHash && ret.tokenPurpose === 'invite';
    delete ret.passwordHash;
    delete ret.tokenHash;
    delete ret.tokenExpires;
    return ret;
  },
});

export type UserDoc = HydratedDocument<InferSchemaType<typeof userSchema>>;
export const User = model('User', userSchema);
