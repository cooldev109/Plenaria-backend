"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.use(auth_1.allRoles);
const validateMessage = [
    (0, express_validator_1.body)('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Message content must be between 1 and 5000 characters'),
    (0, express_validator_1.body)('messageType').optional().isIn(['text', 'file', 'system']).withMessage('Invalid message type'),
    (0, express_validator_1.body)('attachments').optional().isArray().withMessage('Attachments must be an array')
];
const validateConsultationId = [
    (0, express_validator_1.param)('id').isMongoId().withMessage('Invalid consultation ID')
];
router.get('/consultations/:id/messages', validateConsultationId, async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { id } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const userId = req.user._id;
        const userRole = req.user.role;
        const consultation = await models_1.Consultation.findById(id);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }
        const hasAccess = userRole === 'admin' ||
            (userRole === 'customer' && consultation.customerId.toString() === userId.toString()) ||
            (userRole === 'lawyer' && consultation.lawyerId?.toString() === userId.toString());
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this consultation'
            });
        }
        const messages = await models_1.Message.find({
            consultationId: id,
            deletedAt: { $exists: false }
        })
            .populate('senderId', 'name email avatar')
            .populate('replyTo', 'content senderId')
            .sort({ createdAt: -1 })
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit));
        const total = await models_1.Message.countDocuments({
            consultationId: id,
            deletedAt: { $exists: false }
        });
        res.json({
            success: true,
            data: {
                messages: messages.reverse(),
                pagination: {
                    current: Number(page),
                    pages: Math.ceil(total / Number(limit)),
                    total
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/consultations/:id/messages', validateConsultationId, validateMessage, async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { id } = req.params;
        const { content, messageType = 'text', attachments = [], replyTo } = req.body;
        const userId = req.user._id;
        const userRole = req.user.role;
        const consultation = await models_1.Consultation.findById(id);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }
        const hasAccess = userRole === 'admin' ||
            (userRole === 'customer' && consultation.customerId.toString() === userId.toString()) ||
            (userRole === 'lawyer' && consultation.lawyerId?.toString() === userId.toString());
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this consultation'
            });
        }
        if (consultation.chatStatus !== 'active' && userRole === 'customer') {
            return res.status(400).json({
                success: false,
                message: 'Chat is not active yet. Wait for lawyer to accept the consultation.'
            });
        }
        const message = new models_1.Message({
            consultationId: id,
            senderId: userId,
            senderRole: userRole,
            content,
            messageType,
            attachments,
            replyTo
        });
        await message.save();
        const updateData = {
            lastMessageAt: new Date()
        };
        if (userRole === 'customer') {
            updateData.lawyerUnreadCount = (consultation.lawyerUnreadCount || 0) + 1;
        }
        else if (userRole === 'lawyer') {
            updateData.customerUnreadCount = (consultation.customerUnreadCount || 0) + 1;
        }
        await models_1.Consultation.findByIdAndUpdate(id, updateData);
        const populatedMessage = await models_1.Message.findById(message._id)
            .populate('senderId', 'name email avatar')
            .populate('replyTo', 'content senderId');
        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: { message: populatedMessage }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/consultations/:id/messages/read', validateConsultationId, async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { id } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;
        const consultation = await models_1.Consultation.findById(id);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }
        const hasAccess = userRole === 'admin' ||
            (userRole === 'customer' && consultation.customerId.toString() === userId.toString()) ||
            (userRole === 'lawyer' && consultation.lawyerId?.toString() === userId.toString());
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this consultation'
            });
        }
        await models_1.Message.updateMany({
            consultationId: id,
            senderId: { $ne: userId },
            isRead: false
        }, {
            isRead: true,
            readAt: new Date()
        });
        const updateData = {};
        if (userRole === 'customer') {
            updateData.customerUnreadCount = 0;
        }
        else if (userRole === 'lawyer') {
            updateData.lawyerUnreadCount = 0;
        }
        await models_1.Consultation.findByIdAndUpdate(id, updateData);
        res.json({
            success: true,
            message: 'Messages marked as read'
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/consultations/:id/accept', validateConsultationId, async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { id } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;
        if (userRole !== 'lawyer' && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only lawyers can accept consultations'
            });
        }
        const consultation = await models_1.Consultation.findById(id);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }
        if (consultation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Consultation is not in pending status'
            });
        }
        consultation.lawyerId = userId;
        consultation.status = 'assigned';
        consultation.chatStatus = 'active';
        consultation.chatStartedAt = new Date();
        consultation.answeredAt = new Date();
        await consultation.save();
        const systemMessage = new models_1.Message({
            consultationId: id,
            senderId: userId,
            senderRole: 'lawyer',
            content: 'Consultation accepted. Chat is now active.',
            messageType: 'system'
        });
        await systemMessage.save();
        const populatedConsultation = await models_1.Consultation.findById(id)
            .populate('customerId', 'name email')
            .populate('lawyerId', 'name email');
        res.json({
            success: true,
            message: 'Consultation accepted successfully',
            data: { consultation: populatedConsultation }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/consultations/:id/decline', validateConsultationId, [
    (0, express_validator_1.body)('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user._id;
        const userRole = req.user.role;
        if (userRole !== 'lawyer' && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only lawyers can decline consultations'
            });
        }
        const consultation = await models_1.Consultation.findById(id);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }
        if (consultation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Consultation is not in pending status'
            });
        }
        consultation.status = 'cancelled';
        consultation.chatStatus = 'closed';
        consultation.notes = reason || 'Consultation declined by lawyer';
        await consultation.save();
        const systemMessage = new models_1.Message({
            consultationId: id,
            senderId: userId,
            senderRole: 'lawyer',
            content: `Consultation declined. ${reason ? `Reason: ${reason}` : ''}`,
            messageType: 'system'
        });
        await systemMessage.save();
        res.json({
            success: true,
            message: 'Consultation declined successfully',
            data: { consultation }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/consultations/:id/complete', validateConsultationId, async (req, res, next) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        const { id } = req.params;
        const userId = req.user._id;
        const userRole = req.user.role;
        if (userRole !== 'lawyer' && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only lawyers can complete consultations'
            });
        }
        const consultation = await models_1.Consultation.findById(id);
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }
        if (consultation.status !== 'assigned' && consultation.status !== 'in_progress') {
            return res.status(400).json({
                success: false,
                message: 'Consultation is not in a completable status'
            });
        }
        consultation.status = 'completed';
        consultation.chatStatus = 'closed';
        consultation.completedAt = new Date();
        await consultation.save();
        const systemMessage = new models_1.Message({
            consultationId: id,
            senderId: userId,
            senderRole: 'lawyer',
            content: 'Consultation completed successfully.',
            messageType: 'system'
        });
        await systemMessage.save();
        res.json({
            success: true,
            message: 'Consultation completed successfully',
            data: { consultation }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map