import mongoose, { Document } from 'mongoose';
export interface IChatMessage extends Document {
    consultationId: mongoose.Types.ObjectId;
    senderId: mongoose.Types.ObjectId;
    receiverId?: mongoose.Types.ObjectId;
    message: string;
    messageType: 'text' | 'file' | 'image' | 'system';
    attachments?: {
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
    }[];
    isRead: boolean;
    readAt?: Date;
    editedAt?: Date;
    deletedAt?: Date;
    replyTo?: mongoose.Types.ObjectId;
    reactions?: {
        userId: mongoose.Types.ObjectId;
        emoji: string;
        createdAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IChatMessage, {}, {}, {}, mongoose.Document<unknown, {}, IChatMessage, {}, {}> & IChatMessage & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=ChatMessage.d.ts.map