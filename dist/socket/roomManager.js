"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomManager = void 0;
const models_1 = require("../models");
class RoomManager {
    constructor(io) {
        this.activeRooms = new Map();
        this.userSockets = new Map();
        this.io = io;
    }
    async joinConsultationRoom(socket, consultationId) {
        try {
            const consultation = await models_1.Consultation.findById(consultationId)
                .populate('customerId', 'name email')
                .populate('lawyerId', 'name email');
            if (!consultation) {
                socket.emit('error', { message: 'Consultation not found' });
                return false;
            }
            const hasAccess = this.checkConsultationAccess(socket, consultation);
            if (!hasAccess) {
                socket.emit('error', { message: 'Access denied to this consultation' });
                return false;
            }
            const roomName = `consultation_${consultationId}`;
            await socket.join(roomName);
            if (!this.activeRooms.has(consultationId)) {
                this.activeRooms.set(consultationId, new Set());
            }
            this.activeRooms.get(consultationId).add(socket.userId);
            if (!this.userSockets.has(socket.userId)) {
                this.userSockets.set(socket.userId, new Set());
            }
            this.userSockets.get(socket.userId).add(socket.id);
            socket.to(roomName).emit('user_joined', {
                userId: socket.userId,
                userName: socket.user?.name,
                userRole: socket.userRole,
                timestamp: new Date()
            });
            socket.emit('room_joined', {
                consultationId,
                roomName,
                participants: Array.from(this.activeRooms.get(consultationId) || []),
                consultation: {
                    id: consultation._id,
                    subject: consultation.subject,
                    status: consultation.status,
                    customer: consultation.customerId,
                    lawyer: consultation.lawyerId
                }
            });
            console.log(`👥 User ${socket.user?.name} joined consultation room ${consultationId}`);
            return true;
        }
        catch (error) {
            console.error('Error joining consultation room:', error);
            socket.emit('error', { message: 'Failed to join consultation room' });
            return false;
        }
    }
    async leaveConsultationRoom(socket, consultationId) {
        try {
            const roomName = `consultation_${consultationId}`;
            await socket.leave(roomName);
            const roomUsers = this.activeRooms.get(consultationId);
            if (roomUsers) {
                roomUsers.delete(socket.userId);
                if (roomUsers.size === 0) {
                    this.activeRooms.delete(consultationId);
                }
            }
            const userSocketSet = this.userSockets.get(socket.userId);
            if (userSocketSet) {
                userSocketSet.delete(socket.id);
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(socket.userId);
                }
            }
            socket.to(roomName).emit('user_left', {
                userId: socket.userId,
                userName: socket.user?.name,
                userRole: socket.userRole,
                timestamp: new Date()
            });
            console.log(`👋 User ${socket.user?.name} left consultation room ${consultationId}`);
        }
        catch (error) {
            console.error('Error leaving consultation room:', error);
        }
    }
    getActiveUsers(consultationId) {
        return Array.from(this.activeRooms.get(consultationId) || []);
    }
    isUserOnline(userId) {
        return this.userSockets.has(userId) && this.userSockets.get(userId).size > 0;
    }
    getUserRooms(userId) {
        const rooms = [];
        for (const [consultationId, userIds] of this.activeRooms.entries()) {
            if (userIds.has(userId)) {
                rooms.push(`consultation_${consultationId}`);
            }
        }
        return rooms;
    }
    async broadcastToConsultation(consultationId, event, data, excludeSocketId) {
        const roomName = `consultation_${consultationId}`;
        if (excludeSocketId) {
            this.io.to(roomName).except(excludeSocketId).emit(event, data);
        }
        else {
            this.io.to(roomName).emit(event, data);
        }
    }
    async sendToUser(userId, event, data) {
        const userSocketSet = this.userSockets.get(userId);
        if (userSocketSet) {
            for (const socketId of userSocketSet) {
                this.io.to(socketId).emit(event, data);
            }
        }
    }
    handleDisconnect(socket) {
        if (!socket.userId)
            return;
        const userRooms = this.getUserRooms(socket.userId);
        for (const roomName of userRooms) {
            const consultationId = roomName.replace('consultation_', '');
            this.leaveConsultationRoom(socket, consultationId);
        }
        this.userSockets.delete(socket.userId);
        console.log(`🔌 User ${socket.user?.name} disconnected`);
    }
    checkConsultationAccess(socket, consultation) {
        if (socket.userRole === 'admin') {
            return true;
        }
        if (socket.userRole === 'customer' && consultation.customerId._id.toString() === socket.userId) {
            return true;
        }
        if (socket.userRole === 'lawyer' && consultation.lawyerId && consultation.lawyerId._id.toString() === socket.userId) {
            return true;
        }
        return false;
    }
    getRoomStats() {
        const roomDetails = Array.from(this.activeRooms.entries()).map(([consultationId, userIds]) => ({
            consultationId,
            activeUsers: userIds.size,
            users: Array.from(userIds)
        }));
        return {
            totalRooms: this.activeRooms.size,
            totalUsers: this.userSockets.size,
            roomDetails
        };
    }
}
exports.RoomManager = RoomManager;
//# sourceMappingURL=roomManager.js.map