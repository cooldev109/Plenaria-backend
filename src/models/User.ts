import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  phone?: string;
  passwordHash: string;
  role: 'admin' | 'lawyer' | 'customer';
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  plan?: 'basic' | 'plus' | 'premium';
  planExpiresAt?: Date;
  trialExpiresAt?: Date;
  isOnTrial: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'lawyer', 'customer'],
      required: true,
      default: 'customer',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING', 'SUSPENDED'],
      default: function (this: IUser) {
        // Lawyers start as PENDING until admin approval
        return this.role === 'lawyer' ? 'PENDING' : 'ACTIVE';
      },
    },
    plan: {
      type: String,
      enum: ['basic', 'plus', 'premium'],
      required: function (this: IUser) {
        // Only customers need a plan
        return this.role === 'customer';
      },
    },
    planExpiresAt: {
      type: Date,
    },
    trialExpiresAt: {
      type: Date,
    },
    isOnTrial: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 }, { sparse: true });
UserSchema.index({ role: 1, status: 1 });

// Virtual for checking if trial is active
UserSchema.virtual('isTrialActive').get(function (this: IUser) {
  if (!this.isOnTrial || !this.trialExpiresAt) return false;
  return new Date() < this.trialExpiresAt;
});

// Virtual for checking if plan is active
UserSchema.virtual('isPlanActive').get(function (this: IUser) {
  if (!this.planExpiresAt) return true; // No expiry means active
  return new Date() < this.planExpiresAt;
});

// Don't send password hash in JSON responses
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
