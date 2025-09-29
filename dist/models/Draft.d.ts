import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IDraft, {}, {}, {}, mongoose.Document<unknown, {}, IDraft, {}, {}> & IDraft & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Draft.d.ts.map