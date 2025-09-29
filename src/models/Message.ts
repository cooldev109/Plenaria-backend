import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  consultationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderRole: 'customer' | 'lawyer' | 'admin';
  content: string;
  messageType: 'text' | 'file' | 'system';
  attachments?: string[];
  isRead: boolean;
  readAt?: Date;
  replyTo?: mongoose.Types.ObjectId;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
  consultationId: {
    type: Schema.Types.ObjectId,
    ref: 'Consultation',
    required: [true, 'Consultation ID is required']
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  senderRole: {
    type: String,
    enum: ['customer', 'lawyer', 'admin'],
    required: [true, 'Sender role is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [5000, 'Message content cannot exceed 5000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    type: String,
    trim: true
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  editedAt: {
    type: Date
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
MessageSchema.index({ consultationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ isRead: 1, consultationId: 1 });

// Virtual for unread count
MessageSchema.virtual('isUnread').get(function() {
  return !this.isRead;
});

export default mongoose.model<IMessage>('Message', MessageSchema);
