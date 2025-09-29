import { IUser } from '../models/User';
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}
export declare const generateToken: (user: IUser) => string;
export declare const verifyToken: (token: string) => JWTPayload;
export declare const generateRefreshToken: (user: IUser) => string;
//# sourceMappingURL=jwt.d.ts.map