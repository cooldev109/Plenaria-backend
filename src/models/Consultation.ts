import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultation extends Document {
  customerId: mongoose.Types.ObjectId;
  lawyerId?: mongoose.Types.ObjectId;
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  title: string;
  description: string;
  attachments: string[];
  startAt?: Date;
  endAt?: Date;
  responseBy?: Date; // SLA deadline
  rejectionReason?: string;
  sessionDuration?: number; // Duration in minutes
  lastActivityAt?: Date; // For idle tracking
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationSchema: Schema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    lawyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED'],
      required: true,
      default: 'REQUESTED',
      index: true,
    },
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
    attachments: {
      type: [String],
      default: [],
    },
    startAt: {
      type: Date,
    },
    endAt: {
      type: Date,
    },
    responseBy: {
      type: Date,
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    sessionDuration: {
      type: Number, // in minutes
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ConsultationSchema.index({ customerId: 1, status: 1 });
ConsultationSchema.index({ lawyerId: 1, status: 1 });
ConsultationSchema.index({ createdAt: -1 });
ConsultationSchema.index({ responseBy: 1 }, { sparse: true });

// Virtual to check if SLA is breached
ConsultationSchema.virtual('isSlaBreach').get(function (this: IConsultation) {
  if (!this.responseBy) return false;
  if (this.status !== 'REQUESTED') return false;
  return new Date() > this.responseBy;
});

const Consultation = mongoose.model<IConsultation>('Consultation', ConsultationSchema);

export default Consultation;
