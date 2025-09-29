import mongoose, { Document, Schema } from 'mongoose';

export interface IConsultation extends Document {
  customerId: mongoose.Types.ObjectId;
  lawyerId?: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
  response?: string;
  attachments?: string[];
  requestedAt: Date;
  answeredAt?: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  // Chat-related fields
  chatStartedAt?: Date;
  lastMessageAt?: Date;
  customerUnreadCount: number;
  lawyerUnreadCount: number;
  chatStatus: 'waiting_acceptance' | 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationSchema: Schema = new Schema({
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  lawyerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  response: {
    type: String,
    trim: true,
    maxlength: [5000, 'Response cannot exceed 5000 characters']
  },
  attachments: [{
    type: String,
    trim: true
  }],
  requestedAt: {
    type: Date,
    default: Date.now
  },
  answeredAt: {
    type: Date
  },
  scheduledAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  // Chat-related fields
  chatStartedAt: {
    type: Date
  },
  lastMessageAt: {
    type: Date
  },
  customerUnreadCount: {
    type: Number,
    default: 0
  },
  lawyerUnreadCount: {
    type: Number,
    default: 0
  },
  chatStatus: {
    type: String,
    enum: ['waiting_acceptance', 'active', 'closed'],
    default: 'waiting_acceptance'
  }
}, {
  timestamps: true
});

// Index for efficient queries
ConsultationSchema.index({ customerId: 1, status: 1 });
ConsultationSchema.index({ lawyerId: 1, status: 1 });
ConsultationSchema.index({ createdAt: -1 });

export default mongoose.model<IConsultation>('Consultation', ConsultationSchema);
