import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth';
import User from '../models/User';
import Consultation from '../models/Consultation';
import { getComprehensiveMetrics } from '../services/metricsService';

const router = Router();

// All admin routes require admin role
router.use(requireAuth, requireRole('admin'));

/**
 * GET /api/admin/lawyers/pending
 * Get all pending lawyer registrations
 */
router.get('/lawyers/pending', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const lawyers = await User.find({
      role: 'lawyer',
      status: 'PENDING',
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments({
      role: 'lawyer',
      status: 'PENDING',
    });

    return res.status(200).json({
      success: true,
      data: lawyers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get pending lawyers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending lawyers',
    });
  }
});

/**
 * POST /api/admin/lawyers/:id/approve
 * Approve a lawyer registration
 */
router.post('/lawyers/:id/approve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const lawyer = await User.findById(id);

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found',
      });
    }

    if (lawyer.role !== 'lawyer') {
      return res.status(400).json({
        success: false,
        message: 'User is not a lawyer',
      });
    }

    if (lawyer.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Lawyer is not pending approval',
      });
    }

    // Approve lawyer
    lawyer.status = 'ACTIVE';
    await lawyer.save();

    // TODO: Send email notification to lawyer
    console.warn(`[ADMIN] Lawyer approved: ${lawyer.email} by ${req.user?.email}`);

    return res.status(200).json({
      success: true,
      message: 'Lawyer approved successfully',
      data: lawyer,
    });
  } catch (error) {
    console.error('Approve lawyer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve lawyer',
    });
  }
});

/**
 * POST /api/admin/lawyers/:id/reject
 * Reject a lawyer registration
 */
router.post(
  '/lawyers/:id/reject',
  [body('reason').optional().trim()],
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const lawyer = await User.findById(id);

      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer not found',
        });
      }

      if (lawyer.role !== 'lawyer') {
        return res.status(400).json({
          success: false,
          message: 'User is not a lawyer',
        });
      }

      if (lawyer.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Lawyer is not pending approval',
        });
      }

      // Reject lawyer (suspend account)
      lawyer.status = 'SUSPENDED';
      await lawyer.save();

      // TODO: Send email notification to lawyer with reason
      console.warn(
        `[ADMIN] Lawyer rejected: ${lawyer.email} by ${req.user?.email}. Reason: ${reason || 'None'}`
      );

      return res.status(200).json({
        success: true,
        message: 'Lawyer rejected',
        data: lawyer,
      });
    } catch (error) {
      console.error('Reject lawyer error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to reject lawyer',
      });
    }
  }
);

/**
 * GET /api/admin/users
 * Get all users with filters
 */
router.get(
  '/users',
  [
    query('role').optional().isIn(['admin', 'lawyer', 'customer']),
    query('status').optional().isIn(['ACTIVE', 'PENDING', 'SUSPENDED']),
    query('plan').optional().isIn(['basic', 'plus', 'premium']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { role, status, plan, page = 1, limit = 20 } = req.query;

      const query: any = {};

      if (role) query.role = role;
      if (status) query.status = status;
      if (plan) query.plan = plan;

      const skip = (Number(page) - 1) * Number(limit);

      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await User.countDocuments(query);

      return res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get users error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id/suspend
 * Suspend a user account
 */
router.put('/users/:id/suspend', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot suspend admin users',
      });
    }

    user.status = 'SUSPENDED';
    await user.save();

    console.warn(`[ADMIN] User suspended: ${user.email} by ${req.user?.email}`);

    return res.status(200).json({
      success: true,
      message: 'User suspended',
      data: user,
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to suspend user',
    });
  }
});

/**
 * PUT /api/admin/users/:id/activate
 * Activate a suspended user account
 */
router.put('/users/:id/activate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.status = 'ACTIVE';
    await user.save();

    console.warn(`[ADMIN] User activated: ${user.email} by ${req.user?.email}`);

    return res.status(200).json({
      success: true,
      message: 'User activated',
      data: user,
    });
  } catch (error) {
    console.error('Activate user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to activate user',
    });
  }
});

/**
 * PUT /api/admin/users/:id/plan
 * Change user's plan
 */
router.put(
  '/users/:id/plan',
  [
    body('plan').isIn(['basic', 'plus', 'premium']).withMessage('Invalid plan'),
    body('planExpiresAt').optional().isISO8601(),
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { plan, planExpiresAt } = req.body;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (user.role !== 'customer') {
        return res.status(400).json({
          success: false,
          message: 'Only customers have plans',
        });
      }

      user.plan = plan;
      if (planExpiresAt) {
        user.planExpiresAt = new Date(planExpiresAt);
      }
      await user.save();

      console.warn(`[ADMIN] User plan changed: ${user.email} to ${plan} by ${req.user?.email}`);

      return res.status(200).json({
        success: true,
        message: 'Plan updated successfully',
        data: user,
      });
    } catch (error) {
      console.error('Change plan error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to change plan',
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id/trial
 * Grant trial to a user
 */
router.put(
  '/users/:id/trial',
  [body('days').isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90')],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const { days } = req.body;

      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (user.role !== 'customer') {
        return res.status(400).json({
          success: false,
          message: 'Only customers can have trials',
        });
      }

      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + days);

      user.isOnTrial = true;
      user.trialExpiresAt = trialExpiry;
      await user.save();

      console.warn(
        `[ADMIN] Trial granted: ${user.email} for ${days} days by ${req.user?.email}`
      );

      return res.status(200).json({
        success: true,
        message: `Trial granted for ${days} days`,
        data: user,
      });
    } catch (error) {
      console.error('Grant trial error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to grant trial',
      });
    }
  }
);

/**
 * GET /api/admin/consultations
 * Get all consultations for admin dashboard
 */
router.get(
  '/consultations',
  [
    query('status')
      .optional()
      .isIn(['REQUESTED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  async (req: Request, res: Response) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;

      const query: any = {};
      if (status) query.status = status;

      const skip = (Number(page) - 1) * Number(limit);

      const consultations = await Consultation.find(query)
        .populate('customerId', 'email role plan')
        .populate('lawyerId', 'email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Consultation.countDocuments(query);

      return res.status(200).json({
        success: true,
        data: consultations,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get admin consultations error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch consultations',
      });
    }
  }
);

/**
 * GET /api/admin/metrics
 * Get comprehensive metrics for admin dashboard
 * Returns: average response time, pending counts, SLA breaches, trends
 */
router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await getComprehensiveMetrics();

    return res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch metrics',
    });
  }
});

export default router;
