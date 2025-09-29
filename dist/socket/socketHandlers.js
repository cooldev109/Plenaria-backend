"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketHandlers = void 0;
const roomManager_1 = require("./roomManager");
const models_1 = require("../models");
const mongoose_1 = __importDefault(require("mongoose"));
class SocketHandlers {
    constructor(io) {
        this.typingUsers = new Map();
        this.io = io;
        this.roomManager = new roomManager_1.RoomManager(io);
        this.setupEventHandlers();
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔌 New socket connection: ${socket.id}`);
            socket.on('join_consultation', async (data) => {
                try {
                    const { consultationId } = data;
                    if (!consultationId) {
                        socket.emit('error', { message: 'Consultation ID is required' });
                        return;
                    }
                    const success = await this.roomManager.joinConsultationRoom(socket, consultationId);
                    if (success) {
                        await this.loadRecentMessages(socket, consultationId);
                    }
                }
                catch (error) {
                    console.error('Error joining consultation:', error);
                    socket.emit('error', { message: 'Failed to join consultation' });
                }
            });
            socket.on('leave_consultation', async (data) => {
                try {
                    const { consultationId } = data;
                    if (consultationId) {
                        await this.roomManager.leaveConsultationRoom(socket, consultationId);
                    }
                }
                catch (error) {
                    console.error('Error leaving consultation:', error);
                }
            });
            socket.on('send_message', async (data) => {
                try {
                    await this.handleSendMessage(socket, data);
                }
                catch (error) {
                    console.error('Error sending message:', error);
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });
            socket.on('typing_start', (data) => {
                this.handleTypingStart(socket, data.consultationId);
            });
            socket.on('typing_stop', (data) => {
                this.handleTypingStop(socket, data.consultationId);
            });
            socket.on('message_read', async (data) => {
                try {
                    await this.handleMessageRead(socket, data.messageId, data.consultationId);
                }
                catch (error) {
                    console.error('Error marking message as read:', error);
                }
            });
            socket.on('user_online', () => {
                this.handleUserOnline(socket);
            });
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
            socket.on('error', (error) => {
                console.error(`Socket error from ${socket.user?.name}:`, error);
            });
        });
    }
    async handleSendMessage(socket, data) {
        const { consultationId, message, messageType = 'text', attachments, replyTo } = data;
        if (!consultationId || !message?.trim()) {
            socket.emit('error', { message: 'Consultation ID and message are required' });
            return;
        }
        const consultation = await models_1.Consultation.findById(consultationId);
        if (!consultation) {
            socket.emit('error', { message: 'Consultation not found' });
            return;
        }
        let receiverId;
        if (socket.userRole === 'customer' && consultation.lawyerId) {
            receiverId = consultation.lawyerId.toString();
        }
        else if (socket.userRole === 'lawyer' && consultation.customerId) {
            receiverId = consultation.customerId.toString();
        }
        const chatMessage = new models_1.ChatMessage({
            consultationId: new mongoose_1.default.Types.ObjectId(consultationId),
            senderId: new mongoose_1.default.Types.ObjectId(socket.userId),
            receiverId: receiverId ? new mongoose_1.default.Types.ObjectId(receiverId) : undefined,
            message: message.trim(),
            messageType,
            attachments: attachments || [],
            replyTo: replyTo ? new mongoose_1.default.Types.ObjectId(replyTo) : undefined,
            isRead: false
        });
        await chatMessage.save();
        await chatMessage.populate('senderId', 'name email avatar');
        if (replyTo) {
            await chatMessage.populate('replyTo', 'message senderId');
        }
        const messageData = {
            id: chatMessage._id,
            consultationId,
            senderId: chatMessage.senderId,
            receiverId: chatMessage.receiverId,
            message: chatMessage.message,
            messageType: chatMessage.messageType,
            attachments: chatMessage.attachments,
            replyTo: chatMessage.replyTo,
            isRead: chatMessage.isRead,
            createdAt: chatMessage.createdAt,
            updatedAt: chatMessage.updatedAt
        };
        await this.roomManager.broadcastToConsultation(consultationId, 'new_message', messageData, socket.id);
        consultation.updatedAt = new Date();
        await consultation.save();
        console.log(`💬 Message sent in consultation ${consultationId} by ${socket.user?.name}`);
    }
    handleTypingStart(socket, consultationId) {
        if (!this.typingUsers.has(consultationId)) {
            this.typingUsers.set(consultationId, new Set());
        }
        this.typingUsers.get(consultationId).add(socket.userId);
        this.roomManager.broadcastToConsultation(consultationId, 'user_typing', {
            userId: socket.userId,
            userName: socket.user?.name,
            userRole: socket.userRole,
            consultationId
        }, socket.id);
    }
    handleTypingStop(socket, consultationId) {
        const typingSet = this.typingUsers.get(consultationId);
        if (typingSet) {
            typingSet.delete(socket.userId);
            if (typingSet.size === 0) {
                this.typingUsers.delete(consultationId);
            }
        }
        this.roomManager.broadcastToConsultation(consultationId, 'user_stopped_typing', {
            userId: socket.userId,
            userName: socket.user?.name,
            userRole: socket.userRole,
            consultationId
        }, socket.id);
    }
    async handleMessageRead(socket, messageId, consultationId) {
        try {
            const message = await models_1.ChatMessage.findById(messageId);
            if (!message) {
                return;
            }
            if (message.receiverId?.toString() === socket.userId) {
                message.isRead = true;
                message.readAt = new Date();
                await message.save();
                await this.roomManager.sendToUser(message.senderId.toString(), 'message_read', {
                    messageId,
                    consultationId,
                    readBy: socket.userId,
                    readAt: message.readAt
                });
            }
        }
        catch (error) {
            console.error('Error handling message read:', error);
        }
    }
    handleUserOnline(socket) {
        const userRooms = this.roomManager.getUserRooms(socket.userId);
        for (const roomName of userRooms) {
            const consultationId = roomName.replace('consultation_', '');
            this.roomManager.broadcastToConsultation(consultationId, 'user_online', {
                userId: socket.userId,
                userName: socket.user?.name,
                userRole: socket.userRole,
                timestamp: new Date()
            }, socket.id);
        }
    }
    async loadRecentMessages(socket, consultationId) {
        try {
            const messages = await models_1.ChatMessage.find({
                consultationId: new mongoose_1.default.Types.ObjectId(consultationId),
                deletedAt: { $exists: false }
            })
                .populate('senderId', 'name email avatar')
                .populate('replyTo', 'message senderId')
                .sort({ createdAt: -1 })
                .limit(50);
            messages.reverse();
            socket.emit('messages_loaded', {
                consultationId,
                messages: messages.map(msg => ({
                    id: msg._id,
                    consultationId: msg.consultationId,
                    senderId: msg.senderId,
                    receiverId: msg.receiverId,
                    message: msg.message,
                    messageType: msg.messageType,
                    attachments: msg.attachments,
                    replyTo: msg.replyTo,
                    isRead: msg.isRead,
                    readAt: msg.readAt,
                    createdAt: msg.createdAt,
                    updatedAt: msg.updatedAt
                }))
            });
        }
        catch (error) {
            console.error('Error loading recent messages:', error);
            socket.emit('error', { message: 'Failed to load messages' });
        }
    }
    handleDisconnect(socket) {
        for (const [consultationId, typingSet] of this.typingUsers.entries()) {
            if (typingSet.has(socket.userId)) {
                this.handleTypingStop(socket, consultationId);
            }
        }
        this.roomManager.handleDisconnect(socket);
        console.log(`🔌 User ${socket.user?.name} disconnected`);
    }
    getRoomManager() {
        return this.roomManager;
    }
    getStats() {
        return {
            connectedUsers: this.io.engine.clientsCount,
            activeRooms: this.roomManager.getRoomStats(),
            typingUsers: Array.from(this.typingUsers.entries()).map(([consultationId, userIds]) => ({
                consultationId,
                typingUsers: Array.from(userIds)
            }))
        };
    }
}
exports.SocketHandlers = SocketHandlers;
//# sourceMappingURL=socketHandlers.js.map