import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterial {
  name: string;
  url: string;
  size: string;
  type: string;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  materials: IMaterial[]; // Array of material objects
  visibility: 'free' | 'premium';
  duration?: number; // Duration in minutes
  category?: string;
  tags: string[];
  viewCount: number;
  isIntroModule: boolean; // Free introductory module
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    videoUrl: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
    },
    materials: {
      type: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: String, required: true },
        type: { type: String, required: true },
      }],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['free', 'premium'],
      required: true,
      default: 'premium',
    },
    duration: {
      type: Number,
    },
    category: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    isIntroModule: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
CourseSchema.index({ title: 'text', description: 'text', tags: 'text' });
CourseSchema.index({ visibility: 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ isIntroModule: 1 });
CourseSchema.index({ createdAt: -1 });

const Course = mongoose.model<ICourse>('Course', CourseSchema);

export default Course;
