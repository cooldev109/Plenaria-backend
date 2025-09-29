"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketServer = void 0;
const socket_io_1 = require("socket.io");
const authMiddleware_1 = require("./authMiddleware");
const socketHandlers_1 = require("./socketHandlers");
class SocketServer {
    constructor(httpServer) {
        this.io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: [
                    'http://localhost:8080',
                    'http://localhost:3000',
                    'http://localhost:8081',
                    'http://localhost:3001'
                ],
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true
        });
        this.io.use(authMiddleware_1.socketAuthMiddleware);
        this.io.use(authMiddleware_1.requireCustomerOrLawyer);
        this.socketHandlers = new socketHandlers_1.SocketHandlers(this.io);
        this.setupServerEvents();
    }
    setupServerEvents() {
        this.io.engine.on('connection_error', (err) => {
            console.error('Socket.IO connection error:', err);
        });
        console.log('🚀 Socket.IO server initialized');
        console.log('📡 Real-time communication enabled');
        console.log('🔐 Authentication middleware applied');
    }
    getIO() {
        return this.io;
    }
    getSocketHandlers() {
        return this.socketHandlers;
    }
    getStats() {
        return {
            connectedClients: this.io.engine.clientsCount,
            socketHandlers: this.socketHandlers.getStats()
        };
    }
    broadcast(event, data) {
        this.io.emit(event, data);
    }
    broadcastToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }
    sendToUser(userId, event, data) {
        this.socketHandlers.getRoomManager().sendToUser(userId, event, data);
    }
    getActiveRooms() {
        return this.socketHandlers.getRoomManager().getRoomStats();
    }
    isUserOnline(userId) {
        return this.socketHandlers.getRoomManager().isUserOnline(userId);
    }
    async shutdown() {
        console.log('🔄 Shutting down Socket.IO server...');
        this.io.disconnectSockets();
        this.io.close();
        console.log('✅ Socket.IO server shut down successfully');
    }
}
exports.SocketServer = SocketServer;
//# sourceMappingURL=socketServer.js.map