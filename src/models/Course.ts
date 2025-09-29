import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  category: string;
  tags: string[];
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number; // in minutes
  level: 'beginner' | 'intermediate' | 'advanced';
  createdBy: mongoose.Types.ObjectId;
  isPublished: boolean;
  enrollmentCount: number;
  rating: number;
  reviews: mongoose.Types.ObjectId[];
  lessons: mongoose.Types.ObjectId[];
  prerequisites: string[];
  learningObjectives: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema: Schema = new Schema({
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
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required'],
    trim: true
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Level is required'],
    default: 'beginner'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  enrollmentCount: {
    type: Number,
    default: 0,
    min: [0, 'Enrollment count cannot be negative']
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
  }],
  lessons: [{
    type: Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  prerequisites: [{
    type: String,
    trim: true,
    maxlength: [200, 'Prerequisite cannot exceed 200 characters']
  }],
  learningObjectives: [{
    type: String,
    trim: true,
    maxlength: [300, 'Learning objective cannot exceed 300 characters']
  }]
}, {
  timestamps: true
});

// Index for efficient queries
CourseSchema.index({ title: 'text', description: 'text', tags: 'text' });
CourseSchema.index({ category: 1 });
CourseSchema.index({ level: 1 });
CourseSchema.index({ createdBy: 1 });
CourseSchema.index({ isPublished: 1 });
CourseSchema.index({ createdAt: -1 });

export default mongoose.model<ICourse>('Course', CourseSchema);

