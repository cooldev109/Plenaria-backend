import mongoose, { Document } from 'mongoose';
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
    chatStartedAt?: Date;
    lastMessageAt?: Date;
    customerUnreadCount: number;
    lawyerUnreadCount: number;
    chatStatus: 'waiting_acceptance' | 'active' | 'closed';
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IConsultation, {}, {}, {}, mongoose.Document<unknown, {}, IConsultation, {}, {}> & IConsultation & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Consultation.d.ts.map