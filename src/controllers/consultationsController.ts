import { Request, Response } from 'express';
import Consultation from '../models/Consultation';
import Message from '../models/Message';
import User from '../models/User';

// Plan quotas per month
const PLAN_QUOTAS: { [key: string]: number } = {
  basic: 3,
  plus: 5,
  premium: -1, // unlimited
};

// SLA response times in hours
const SLA_RESPONSE_TIME_HOURS = 24;

/**
 * Check if customer has remaining quota for consultations
 */
export const checkQuota = async (customerId: string): Promise<{ hasQuota: boolean; used: number; limit: number }> => {
  const user = await User.findById(customerId);

  if (!user || user.role !== 'customer') {
    return { hasQuota: false, used: 0, limit: 0 };
  }

  const quota = PLAN_QUOTAS[user.plan || 'basic'];

  // Premium has unlimited consultations
  if (quota === -1) {
    return { hasQuota: true, used: 0, limit: -1 };
  }

  // Count consultations this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const usedCount = await Consultation.countDocuments({
    customerId,
    createdAt: { $gte: startOfMonth },
    status: { $nin: ['CANCELLED'] },
  });

  return {
    hasQuota: usedCount < quota,
    used: usedCount,
    limit: quota,
  };
};

/**
 * Create a new consultation request
 */
export const createConsultation = async (req: Request, res: Response) => {
  try {
    const { title, description, question, lawyerId, attachments = [] } = req.body;
    const customerId = req.user?._id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Support both "question" and "description" for backwards compatibility
    const consultationDescription = description || question || '';
    const consultationTitle = title || 'Consultoria Jurídica';

    // Check quota
    const quotaCheck = await checkQuota(customerId.toString());
    if (!quotaCheck.hasQuota) {
      return res.status(403).json({
        success: false,
        message: 'Monthly consultation quota exceeded',
        quota: quotaCheck,
      });
    }

    // Verify lawyer exists and is active if provided
    if (lawyerId) {
      const lawyer = await User.findOne({
        _id: lawyerId,
        role: 'lawyer',
        status: 'ACTIVE',
      });

      if (!lawyer) {
        return res.status(400).json({
          success: false,
          message: 'Selected lawyer is not available',
        });
      }
    }

    // Calculate SLA deadline
    const responseBy = new Date();
    responseBy.setHours(responseBy.getHours() + SLA_RESPONSE_TIME_HOURS);

    // Create consultation - if lawyer is selected, start it immediately
    const consultationData: any = {
      customerId,
      title: consultationTitle,
      description: consultationDescription,
      attachments,
      responseBy,
    };

    if (lawyerId) {
      // Customer selected a lawyer - start consultation immediately
      consultationData.lawyerId = lawyerId;
      consultationData.status = 'ACCEPTED';
      consultationData.startAt = new Date();
      consultationData.lastActivityAt = new Date();
    } else {
      // No lawyer selected - create as requested
      consultationData.status = 'REQUESTED';
    }

    const consultation = await Consultation.create(consultationData);

    // Create initial message with the customer's question
    if (consultationDescription) {
      await Message.create({
        consultationId: consultation._id,
        senderId: customerId,
        text: consultationDescription,
        deliveredAt: new Date(),
      });
    }

    // Populate info
    await consultation.populate([
      { path: 'customerId', select: 'email phone' },
      { path: 'lawyerId', select: 'email' },
    ]);

    // Notify
    if (lawyerId) {
      console.warn(`[LAWYER NOTIFICATION] New direct consultation assigned to lawyer: ${lawyerId}`);
    } else {
      console.warn(`[LAWYER NOTIFICATION] New consultation request: ${consultation._id}`);
    }

    return res.status(201).json({
      success: true,
      message: lawyerId ? 'Consultation started with selected lawyer' : 'Consultation request created',
      data: consultation,
      quota: quotaCheck,
    });
  } catch (error) {
    console.error('Create consultation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create consultation',
    });
  }
};

/**
 * Get consultations list (filtered by role)
 */
export const getConsultations = async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const query: any = {};

    // Filter by role
    if (userRole === 'customer') {
      query.customerId = userId;
    } else if (userRole === 'lawyer') {
      // Lawyers see:
      // 1. All REQUESTED consultations (available to accept)
      // 2. Their assigned consultations (ACCEPTED, IN_PROGRESS, FINISHED)
      if (status) {
        if (status === 'REQUESTED') {
          // Show all unassigned requests
          query.status = 'REQUESTED';
        } else {
          // Show their assigned consultations with specific status
          query.lawyerId = userId;
          query.status = status;
        }
      } else {
        // No status filter - show both available requests and their assigned consultations
        query.$or = [
          { status: 'REQUESTED' },
          { lawyerId: userId }
        ];
      }
    }
    // Admin sees all

    // Filter by status if provided (only for admin and customer)
    if (status && userRole !== 'lawyer' && userRole !== 'customer') {
      query.status = status;
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const consultations = await Consultation.find(query)
      .populate('customerId', 'email phone')
      .populate('lawyerId', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Add question field as alias for description for backwards compatibility
    const consultationsWithQuestion = consultations.map((c: any) => ({
      ...c,
      question: c.description,
      customer: c.customerId,
      lawyer: c.lawyerId,
    }));

    return res.status(200).json(consultationsWithQuestion);
  } catch (error) {
    console.error('Get consultations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch consultations',
    });
  }
};

/**
 * Get a single consultation
 */
export const getConsultation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const consultation = await Consultation.findById(id)
      .populate('customerId', 'email phone')
      .populate('lawyerId', 'email')
      .lean();

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found',
      });
    }

    const consultationData: any = consultation;

    // Check access permissions
    if (userRole === 'customer' && consultationData.customerId._id.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (userRole === 'lawyer' && consultationData.lawyerId?._id?.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Add question field and rename populated fields for backwards compatibility
    const result = {
      ...consultationData,
      question: consultationData.description,
      customer: consultationData.customerId,
      lawyer: consultationData.lawyerId,
      startedAt: consultationData.startAt,
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Get consultation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch consultation',
    });
  }
};

/**
 * Get quota information for current customer
 */
export const getQuota = async (req: Request, res: Response) => {
  try {
    const customerId = req.user?._id;
    const user = req.user;

    if (!customerId || user?.role !== 'customer') {
      return res.status(403).json({
        success: false,
        message: 'Only customers can check quota',
      });
    }

    const quotaCheck = await checkQuota(customerId.toString());

    // Format response to match frontend expectations
    return res.status(200).json({
      used: quotaCheck.used,
      limit: quotaCheck.limit === -1 ? null : quotaCheck.limit,
      remaining: quotaCheck.limit === -1 ? null : quotaCheck.limit - quotaCheck.used,
      isUnlimited: quotaCheck.limit === -1,
    });
  } catch (error) {
    console.error('Get quota error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch quota',
    });
  }
};

/**
 * Accept a consultation (lawyer only)
 */
export const acceptConsultation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lawyerId = req.user?._id;

    const consultation = await Consultation.findById(id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found',
      });
    }

    // Can only accept if REQUESTED
    if (consultation.status !== 'REQUESTED') {
      return res.status(400).json({
        success: false,
        message: 'Can only accept consultations in REQUESTED status',
      });
    }

    consultation.status = 'ACCEPTED';
    consultation.lawyerId = lawyerId as any;
    await consultation.save();

    await consultation.populate([
      { path: 'customerId', select: 'email phone' },
      { path: 'lawyerId', select: 'email' },
    ]);

    return res.status(200).json({
      success: true,
      message: 'Consultation accepted',
      data: consultation,
    });
  } catch (error) {
    console.error('Accept consultation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to accept consultation',
    });
  }
};

/**
 * Reject a consultation (lawyer only)
 */
export const rejectConsultation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const consultation = await Consultation.findById(id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found',
      });
    }

    // Can only reject if REQUESTED
    if (consultation.status !== 'REQUESTED') {
      return res.status(400).json({
        success: false,
        message: 'Can only reject consultations in REQUESTED status',
      });
    }

    consultation.status = 'REJECTED';
    consultation.rejectionReason = reason;
    await consultation.save();

    await consultation.populate('customerId', 'email');

    return res.status(200).json({
      success: true,
      message: 'Consultation rejected',
      data: consultation,
    });
  } catch (error) {
    console.error('Reject consultation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject consultation',
    });
  }
};

/**
 * Get messages for a consultation
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    const consultation = await Consultation.findById(id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found',
      });
    }

    // Check access permissions
    if (userRole === 'customer' && consultation.customerId.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    if (userRole === 'lawyer' && consultation.lawyerId?.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Get messages
    const messages = await Message.find({ consultationId: id })
      .populate('senderId', 'email role')
      .sort({ createdAt: 1 })
      .lean();

    // Transform to match frontend expectations
    const transformedMessages = messages.map((msg: any) => ({
      _id: msg._id,
      consultation: msg.consultationId,
      sender: msg.senderId,
      content: msg.text,
      isRead: !!msg.readAt,
      createdAt: msg.createdAt,
    }));

    return res.status(200).json(transformedMessages);
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch messages',
    });
  }
};

/**
 * Cancel a consultation (customer only, before it's accepted)
 */
export const cancelConsultation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerId = req.user?._id;

    const consultation = await Consultation.findById(id);

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found',
      });
    }

    // Only customer who created it can cancel
    if (consultation.customerId.toString() !== customerId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Can only cancel if REQUESTED
    if (consultation.status !== 'REQUESTED') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel consultations in REQUESTED status',
      });
    }

    consultation.status = 'CANCELLED';
    await consultation.save();

    return res.status(200).json({
      success: true,
      message: 'Consultation cancelled',
      data: consultation,
    });
  } catch (error) {
    console.error('Cancel consultation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel consultation',
    });
  }
};
