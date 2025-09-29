"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const models_1 = require("../models");
const mongoose_1 = __importDefault(require("mongoose"));
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.get('/consultations/:consultationId/messages', auth_1.allRoles, async (req, res, next) => {
    try {
        const { consultationId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const consultation = await models_1.Consultation.findById(consultationId);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }
        const hasAccess = req.user?.role === 'admin' ||
            (req.user?.role === 'customer' && consultation.customerId.toString() === req.user._id.toString()) ||
            (req.user?.role === 'lawyer' && consultation.lawyerId?.toString() === req.user._id.toString());
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this consultation'
            });
        }
        const skip = (Number(page) - 1) * Number(limit);
        const messages = await models_1.ChatMessage.find({
            consultationId: new mongoose_1.default.Types.ObjectId(consultationId),
            deletedAt: { $exists: false }
        })
            .populate('senderId', 'name email avatar')
            .populate('replyTo', 'message senderId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
        const totalMessages = await models_1.ChatMessage.countDocuments({
            consultationId: new mongoose_1.default.Types.ObjectId(consultationId),
            deletedAt: { $exists: false }
        });
        res.json({
            success: true,
            data: {
                messages: messages.reverse(),
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: totalMessages,
                    pages: Math.ceil(totalMessages / Number(limit))
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/consultations/:consultationId/messages', auth_1.allRoles, async (req, res, next) => {
    try {
        const { consultationId } = req.params;
        const { message, messageType = 'text', attachments = [], replyTo } = req.body;
        if (!message?.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }
        const consultation = await models_1.Consultation.findById(consultationId);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }
        const hasAccess = req.user?.role === 'admin' ||
            (req.user?.role === 'customer' && consultation.customerId.toString() === req.user._id.toString()) ||
            (req.user?.role === 'lawyer' && consultation.lawyerId?.toString() === req.user._id.toString());
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this consultation'
            });
        }
        let receiverId;
        if (req.user?.role === 'customer' && consultation.lawyerId) {
            receiverId = consultation.lawyerId.toString();
        }
        else if (req.user?.role === 'lawyer' && consultation.customerId) {
            receiverId = consultation.customerId.toString();
        }
        const chatMessage = new models_1.ChatMessage({
            consultationId: new mongoose_1.default.Types.ObjectId(consultationId),
            senderId: new mongoose_1.default.Types.ObjectId(req.user._id.toString()),
            receiverId: receiverId ? new mongoose_1.default.Types.ObjectId(receiverId) : undefined,
            message: message.trim(),
            messageType,
            attachments,
            replyTo: replyTo ? new mongoose_1.default.Types.ObjectId(replyTo) : undefined,
            isRead: false
        });
        await chatMessage.save();
        await chatMessage.populate('senderId', 'name email avatar');
        if (replyTo) {
            await chatMessage.populate('replyTo', 'message senderId');
        }
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { message: chatMessage }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/messages/:messageId/read', auth_1.allRoles, async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const message = await models_1.ChatMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        if (message.receiverId?.toString() === req.user._id.toString()) {
            message.isRead = true;
            message.readAt = new Date();
            await message.save();
        }
        res.json({
            success: true,
            message: 'Message marked as read',
            data: { message }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/messages/unread-count', auth_1.allRoles, async (req, res, next) => {
    try {
        const unreadCount = await models_1.ChatMessage.countDocuments({
            receiverId: new mongoose_1.default.Types.ObjectId(req.user._id.toString()),
            isRead: false,
            deletedAt: { $exists: false }
        });
        res.json({
            success: true,
            data: { unreadCount }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/consultations/active', auth_1.allRoles, async (req, res, next) => {
    try {
        let consultations;
        if (req.user?.role === 'customer') {
            consultations = await models_1.Consultation.find({
                customerId: req.user._id,
                status: { $in: ['assigned', 'in_progress'] }
            })
                .populate('lawyerId', 'name email avatar')
                .sort({ updatedAt: -1 });
        }
        else if (req.user?.role === 'lawyer') {
            consultations = await models_1.Consultation.find({
                lawyerId: req.user._id,
                status: { $in: ['assigned', 'in_progress'] }
            })
                .populate('customerId', 'name email avatar')
                .sort({ updatedAt: -1 });
        }
        else {
            consultations = await models_1.Consultation.find({
                status: { $in: ['assigned', 'in_progress'] }
            })
                .populate('customerId', 'name email avatar')
                .populate('lawyerId', 'name email avatar')
                .sort({ updatedAt: -1 });
        }
        const consultationsWithUnread = await Promise.all(consultations.map(async (consultation) => {
            const unreadCount = await models_1.ChatMessage.countDocuments({
                consultationId: consultation._id,
                receiverId: req.user._id,
                isRead: false,
                deletedAt: { $exists: false }
            });
            return {
                ...consultation.toObject(),
                unreadCount
            };
        }));
        res.json({
            success: true,
            data: { consultations: consultationsWithUnread }
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/messages/:messageId', auth_1.allRoles, async (req, res, next) => {
    try {
        const { messageId } = req.params;
        const message = await models_1.ChatMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }
        if (message.senderId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own messages'
            });
        }
        message.deletedAt = new Date();
        await message.save();
        res.json({
            success: true,
            message: 'Message deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map