import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IMessage, {}, {}, {}, mongoose.Document<unknown, {}, IMessage, {}, {}> & IMessage & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Message.d.ts.map