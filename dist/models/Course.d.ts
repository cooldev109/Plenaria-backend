import mongoose, { Document } from 'mongoose';
export interface ICourse extends Document {
    title: string;
    description: string;
    category: string;
    tags: string[];
    videoUrl: string;
    thumbnailUrl?: string;
    duration: number;
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
declare const _default: mongoose.Model<ICourse, {}, {}, {}, mongoose.Document<unknown, {}, ICourse, {}, {}> & ICourse & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Course.d.ts.map