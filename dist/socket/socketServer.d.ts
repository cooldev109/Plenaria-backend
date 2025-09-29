import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { SocketHandlers } from './socketHandlers';
export declare class SocketServer {
    private io;
    private socketHandlers;
    constructor(httpServer: HTTPServer);
    private setupServerEvents;
    getIO(): SocketIOServer;
    getSocketHandlers(): SocketHandlers;
    getStats(): any;
    broadcast(event: string, data: any): void;
    broadcastToRoom(room: string, event: string, data: any): void;
    sendToUser(userId: string, event: string, data: any): void;
    getActiveRooms(): any;
    isUserOnline(userId: string): boolean;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=socketServer.d.ts.map