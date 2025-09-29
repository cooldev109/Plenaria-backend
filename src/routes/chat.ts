import express from 'express';
import { Message, Consultation } from '../models';
import { authMiddleware, allRoles } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();

// Apply authentication to all routes
router.use(authMiddleware);
router.use(allRoles);

// Validation middleware
const validateMessage = [
  body('content').trim().isLength({ min: 1, max: 5000 }).withMessage('Message content must be between 1 and 5000 characters'),
  body('messageType').optional().isIn(['text', 'file', 'system']).withMessage('Invalid message type'),
  body('attachments').optional().isArray().withMessage('Attachments must be an array')
];

const validateConsultationId = [
  param('id').isMongoId().withMessage('Invalid consultation ID')
];

// Get messages for a consultation
router.get('/consultations/:id/messages', validateConsultationId, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user!._id;
    const userRole = req.user!.role;

    // Check if user has access to this consultation
    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check permissions
    const hasAccess = 
      userRole === 'admin' ||
      (userRole === 'customer' && consultation.customerId.toString() === userId.toString()) ||
      (userRole === 'lawyer' && consultation.lawyerId?.toString() === userId.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this consultation'
      });
    }

    // Get messages with pagination
    const messages = await Message.find({ 
      consultationId: id,
      deletedAt: { $exists: false }
    })
      .populate('senderId', 'name email avatar')
      .populate('replyTo', 'content senderId')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Message.countDocuments({ 
      consultationId: id,
      deletedAt: { $exists: false }
    });

    res.json({
      success: true,
      data: {
        messages: messages.reverse(), // Reverse to show oldest first
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Send a new message
router.post('/consultations/:id/messages', validateConsultationId, validateMessage, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { content, messageType = 'text', attachments = [], replyTo } = req.body;
    const userId = req.user!._id;
    const userRole = req.user!.role;

    // Check if user has access to this consultation
    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check permissions and chat status
    const hasAccess = 
      userRole === 'admin' ||
      (userRole === 'customer' && consultation.customerId.toString() === userId.toString()) ||
      (userRole === 'lawyer' && consultation.lawyerId?.toString() === userId.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this consultation'
      });
    }

    // Check if chat is active (lawyer has accepted)
    if (consultation.chatStatus !== 'active' && userRole === 'customer') {
      return res.status(400).json({
        success: false,
        message: 'Chat is not active yet. Wait for lawyer to accept the consultation.'
      });
    }

    // Create new message
    const message = new Message({
      consultationId: id,
      senderId: userId,
      senderRole: userRole,
      content,
      messageType,
      attachments,
      replyTo
    });

    await message.save();

    // Update consultation with last message time and unread count
    const updateData: any = {
      lastMessageAt: new Date()
    };

    // Increment unread count for the other participant
    if (userRole === 'customer') {
      updateData.lawyerUnreadCount = (consultation.lawyerUnreadCount || 0) + 1;
    } else if (userRole === 'lawyer') {
      updateData.customerUnreadCount = (consultation.customerUnreadCount || 0) + 1;
    }

    await Consultation.findByIdAndUpdate(id, updateData);

    // Populate the message for response
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name email avatar')
      .populate('replyTo', 'content senderId');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: populatedMessage }
    });
  } catch (error) {
    next(error);
  }
});

// Mark messages as read
router.put('/consultations/:id/messages/read', validateConsultationId, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user!._id;
    const userRole = req.user!.role;

    // Check if user has access to this consultation
    const consultation = await Consultation.findById(id);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    // Check permissions
    const hasAccess = 
      userRole === 'admin' ||
      (userRole === 'customer' && consultation.customerId.toString() === userId.toString()) ||
      (userRole === 'lawyer' && consultation.lawyerId?.toString() === userId.toString());

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this consultation'
      });
    }

    // Mark all unread messages as read
    await Message.updateMany(
      { 
        consultationId: id,
        senderId: { $ne: userId },
        isRead: false
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    // Reset unread count for current user
    const updateData: any = {};
    if (userRole === 'customer') {
      updateData.customerUnreadCount = 0;
    } else if (userRole === 'lawyer') {
      updateData.lawyerUnreadCount = 0;
    }

    await Consultation.findByIdAndUpdate(id, updateData);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// Accept consultation (lawyer only)
router.post('/consultations/:id/accept', validateConsultationId, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user!._id;
    const userRole = req.user!.role;

    if (userRole !== 'lawyer' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only lawyers can accept consultations'
      });
    }

    const consultation = await Consultation.findById(id);
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

    // Update consultation
    consultation.lawyerId = userId;
    consultation.status = 'assigned';
    consultation.chatStatus = 'active';
    consultation.chatStartedAt = new Date();
    consultation.answeredAt = new Date();
    await consultation.save();

    // Create system message
    const systemMessage = new Message({
      consultationId: id,
      senderId: userId,
      senderRole: 'lawyer',
      content: 'Consultation accepted. Chat is now active.',
      messageType: 'system'
    });
    await systemMessage.save();

    // Populate consultation for response
    const populatedConsultation = await Consultation.findById(id)
      .populate('customerId', 'name email')
      .populate('lawyerId', 'name email');

    res.json({
      success: true,
      message: 'Consultation accepted successfully',
      data: { consultation: populatedConsultation }
    });
  } catch (error) {
    next(error);
  }
});

// Decline consultation (lawyer only)
router.post('/consultations/:id/decline', validateConsultationId, [
  body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!._id;
    const userRole = req.user!.role;

    if (userRole !== 'lawyer' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only lawyers can decline consultations'
      });
    }

    const consultation = await Consultation.findById(id);
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

    // Update consultation
    consultation.status = 'cancelled';
    consultation.chatStatus = 'closed';
    consultation.notes = reason || 'Consultation declined by lawyer';
    await consultation.save();

    // Create system message
    const systemMessage = new Message({
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
  } catch (error) {
    next(error);
  }
});

// Complete consultation
router.post('/consultations/:id/complete', validateConsultationId, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user!._id;
    const userRole = req.user!.role;

    if (userRole !== 'lawyer' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only lawyers can complete consultations'
      });
    }

    const consultation = await Consultation.findById(id);
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

    // Update consultation
    consultation.status = 'completed';
    consultation.chatStatus = 'closed';
    consultation.completedAt = new Date();
    await consultation.save();

    // Create system message
    const systemMessage = new Message({
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
  } catch (error) {
    next(error);
  }
});

export default router;
