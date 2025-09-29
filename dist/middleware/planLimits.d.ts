import { Request, Response, NextFunction } from 'express';
export declare const checkConsultationLimits: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const checkCourseAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const checkProjectAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare global {
    namespace Express {
        interface Request {
            consultationInfo?: {
                currentCount: number;
                monthlyLimit: number;
                planName: string;
                remainingConsultations: number;
            };
            userPlanLevel?: string;
        }
    }
}
//# sourceMappingURL=planLimits.d.ts.map