import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket } from './authMiddleware';
export declare class RoomManager {
    private io;
    private activeRooms;
    private userSockets;
    constructor(io: SocketIOServer);
    joinConsultationRoom(socket: AuthenticatedSocket, consultationId: string): Promise<boolean>;
    leaveConsultationRoom(socket: AuthenticatedSocket, consultationId: string): Promise<void>;
    getActiveUsers(consultationId: string): string[];
    isUserOnline(userId: string): boolean;
    getUserRooms(userId: string): string[];
    broadcastToConsultation(consultationId: string, event: string, data: any, excludeSocketId?: string): Promise<void>;
    sendToUser(userId: string, event: string, data: any): Promise<void>;
    handleDisconnect(socket: AuthenticatedSocket): void;
    private checkConsultationAccess;
    getRoomStats(): {
        totalRooms: number;
        totalUsers: number;
        roomDetails: any[];
    };
}
//# sourceMappingURL=roomManager.d.ts.map