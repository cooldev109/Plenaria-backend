import mongoose, { Document } from 'mongoose';
export interface IPlan extends Document {
    name: string;
    description: string;
    features: string[];
    price: number;
    currency: string;
    billingCycle: 'monthly' | 'yearly';
    maxConsultations: number | null;
    hasProjectDatabase: boolean;
    hasCourses: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPlan, {}, {}, {}, mongoose.Document<unknown, {}, IPlan, {}, {}> & IPlan & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Plan.d.ts.map