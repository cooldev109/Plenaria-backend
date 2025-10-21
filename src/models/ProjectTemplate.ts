import mongoose, { Schema, Document } from 'mongoose';

export interface IMaterial {
  name: string;
  url: string;
  size: string;
  type: string;
}

export interface IProjectTemplate extends Document {
  title: string;
  category: string;
  type: 'PL' | 'motion' | 'request' | 'recommendation';
  fileUrl: string;
  format: 'pdf' | 'docx' | 'doc';
  tags: string[];
  visibility: 'basic' | 'plus' | 'premium';
  description?: string;
  downloadCount: number;
  supplementaryMaterials?: IMaterial[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectTemplateSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['PL', 'motion', 'request', 'recommendation'],
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
    },
    format: {
      type: String,
      enum: ['pdf', 'docx', 'doc'],
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ['basic', 'plus', 'premium'],
      required: true,
      default: 'basic',
    },
    description: {
      type: String,
      trim: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    supplementaryMaterials: {
      type: [{
        name: { type: String, required: true },
        url: { type: String, required: true },
        size: { type: String, required: true },
        type: { type: String, required: true },
      }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
ProjectTemplateSchema.index({ title: 'text', description: 'text', tags: 'text' });
ProjectTemplateSchema.index({ category: 1 });
ProjectTemplateSchema.index({ type: 1 });
ProjectTemplateSchema.index({ visibility: 1 });
ProjectTemplateSchema.index({ createdAt: -1 });

const ProjectTemplate = mongoose.model<IProjectTemplate>(
  'ProjectTemplate',
  ProjectTemplateSchema
);

export default ProjectTemplate;
