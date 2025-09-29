import mongoose, { Document } from 'mongoose';
export interface IProject extends Document {
    title: string;
    description: string;
    category: string;
    tags: string[];
    fileUrl: string;
    fileType: string;
    fileSize: number;
    createdBy: mongoose.Types.ObjectId;
    isPublic: boolean;
    requiredPlan: 'basic' | 'plus' | 'complete';
    downloadCount: number;
    rating: number;
    reviews: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IProject, {}, {}, {}, mongoose.Document<unknown, {}, IProject, {}, {}> & IProject & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Project.d.ts.map