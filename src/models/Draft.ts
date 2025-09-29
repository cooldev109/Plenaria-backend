import mongoose, { Document, Schema } from 'mongoose';

export interface IDraft extends Document {
  title: string;
  description: string;
  type: 'legal_opinion' | 'contract' | 'motion' | 'brief' | 'other';
  category: string;
  tags: string[];
  fileUrl: string;
  fileType: string;
  fileSize: number;
  lawyerId: mongoose.Types.ObjectId;
  consultationId?: mongoose.Types.ObjectId;
  isPublic: boolean;
  downloadCount: number;
  rating: number;
  reviews: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const DraftSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['legal_opinion', 'contract', 'motion', 'brief', 'other'],
    required: [true, 'Draft type is required'],
    default: 'other'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
    trim: true
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
    trim: true
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative']
  },
  lawyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Lawyer ID is required']
  },
  consultationId: {
    type: Schema.Types.ObjectId,
    ref: 'Consultation',
    required: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: [0, 'Download count cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: 'Review'
  }]
}, {
  timestamps: true
});

// Index for efficient queries
DraftSchema.index({ title: 'text', description: 'text', tags: 'text' });
DraftSchema.index({ type: 1 });
DraftSchema.index({ category: 1 });
DraftSchema.index({ lawyerId: 1 });
DraftSchema.index({ consultationId: 1 });
DraftSchema.index({ isPublic: 1 });
DraftSchema.index({ createdAt: -1 });

export default mongoose.model<IDraft>('Draft', DraftSchema);

