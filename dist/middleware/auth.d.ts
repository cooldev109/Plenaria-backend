import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models';
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const roleMiddleware: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const adminOnly: (req: Request, res: Response, next: NextFunction) => void;
export declare const lawyerOnly: (req: Request, res: Response, next: NextFunction) => void;
export declare const customerOnly: (req: Request, res: Response, next: NextFunction) => void;
export declare const adminOrLawyer: (req: Request, res: Response, next: NextFunction) => void;
export declare const adminOrCustomer: (req: Request, res: Response, next: NextFunction) => void;
export declare const allRoles: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map