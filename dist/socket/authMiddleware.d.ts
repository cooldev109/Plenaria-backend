import { Socket } from 'socket.io';
import { IUser } from '../models';
export interface AuthenticatedSocket extends Socket {
    user?: IUser;
    userId?: string;
    userRole?: string;
}
export declare const socketAuthMiddleware: (socket: AuthenticatedSocket, next: (err?: Error) => void) => Promise<void>;
export declare const requireRole: (allowedRoles: string[]) => (socket: AuthenticatedSocket, next: (err?: Error) => void) => void;
export declare const requireCustomerOrLawyer: (socket: AuthenticatedSocket, next: (err?: Error) => void) => void;
//# sourceMappingURL=authMiddleware.d.ts.map