import { Server as SocketIOServer } from 'socket.io';
import { RoomManager } from './roomManager';
export declare class SocketHandlers {
    private io;
    private roomManager;
    private typingUsers;
    constructor(io: SocketIOServer);
    private setupEventHandlers;
    private handleSendMessage;
    private handleTypingStart;
    private handleTypingStop;
    private handleMessageRead;
    private handleUserOnline;
    private loadRecentMessages;
    private handleDisconnect;
    getRoomManager(): RoomManager;
    getStats(): any;
}
//# sourceMappingURL=socketHandlers.d.ts.map