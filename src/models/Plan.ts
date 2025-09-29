import mongoose, { Document, Schema } from 'mongoose';

export interface IPlan extends Document {
  name: string;
  description: string;
  features: string[];
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  maxConsultations: number | null; // null means unlimited
  hasProjectDatabase: boolean;
  hasCourses: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
    maxlength: [50, 'Plan name cannot exceed 50 characters']
  },
  description: {
    type: String,
    required: [true, 'Plan description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  features: [{
    type: String,
    required: true,
    trim: true
  }],
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    default: 'USD',
    enum: ['USD', 'BRL', 'EUR']
  },
  billingCycle: {
    type: String,
    required: [true, 'Billing cycle is required'],
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  maxConsultations: {
    type: Number,
    default: null, // null means unlimited
    min: [0, 'Max consultations cannot be negative']
  },
  hasProjectDatabase: {
    type: Boolean,
    default: false
  },
  hasCourses: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<IPlan>('Plan', PlanSchema);

