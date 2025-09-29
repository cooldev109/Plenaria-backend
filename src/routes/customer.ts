import express from 'express';
import { Project, Course, Consultation, Plan, User } from '../models';
import { authMiddleware, allRoles } from '../middleware/auth';
import { checkConsultationLimits, checkCourseAccess, checkProjectAccess } from '../middleware/planLimits';
import { validateConsultation } from '../middleware/validation';

const router = express.Router();

// Apply authentication middleware to all routes
// Allow admin, lawyer, and customer access (admin/lawyer for testing/management)
router.use(authMiddleware);
router.use(allRoles);

// Get customer dashboard data
router.get('/dashboard', async (req, res, next) => {
  try {
    const customerId = req.user!._id;
    const userPlanId = req.user!.planId;

    // Get user's plan details
    let plan = null;
    if (userPlanId) {
      plan = await Plan.findById(userPlanId);
    }

    // Get current month's consultation count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalConsultations,
      monthlyConsultations,
      completedConsultations,
      pendingConsultations,
      recentConsultations,
      availableProjects,
      availableCourses
    ] = await Promise.all([
      Consultation.countDocuments({ customerId }),
      Consultation.countDocuments({
        customerId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      Consultation.countDocuments({ customerId, status: 'completed' }),
      Consultation.countDocuments({ customerId, status: { $in: ['pending', 'assigned', 'in_progress'] } }),
      Consultation.find({ customerId })
        .populate('lawyerId', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
      Project.countDocuments({ isPublic: true }),
      Course.countDocuments({ isPublic: true })
    ]);

    // Calculate consultation limits
    let monthlyLimit = 0;
    let hasCourseAccess = false;
    if (plan) {
      switch (plan.name.toLowerCase()) {
        case 'basic':
          monthlyLimit = 3;
          break;
        case 'plus':
          monthlyLimit = 5;
          break;
        case 'complete':
          monthlyLimit = -1; // Unlimited
          hasCourseAccess = true;
          break;
      }
    }

    res.json({
      success: true,
      data: {
        plan: plan ? {
          _id: plan._id,
          name: plan.name,
          price: plan.price,
          features: plan.features,
          monthlyLimit,
          hasCourseAccess,
          remainingConsultations: monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - monthlyConsultations)
        } : null,
        statistics: {
          totalConsultations,
          monthlyConsultations,
          completedConsultations,
          pendingConsultations,
          availableProjects,
          availableCourses
        },
        recentConsultations
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get customer's plan details
router.get('/plan', async (req, res, next) => {
  try {
    const userPlanId = req.user!.planId;

    if (!userPlanId) {
      return res.status(404).json({
        success: false,
        message: 'No subscription plan found'
      });
    }

    const plan = await Plan.findById(userPlanId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }

    // Get current month's consultation count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyConsultations = await Consultation.countDocuments({
      customerId: req.user!._id,
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Calculate limits
    let monthlyLimit = 0;
    let hasCourseAccess = false;
    switch (plan.name.toLowerCase()) {
      case 'basic':
        monthlyLimit = 3;
        break;
      case 'plus':
        monthlyLimit = 5;
        break;
      case 'complete':
        monthlyLimit = -1; // Unlimited
        hasCourseAccess = true;
        break;
    }

    res.json({
      success: true,
      data: {
        plan: {
          _id: plan._id,
          name: plan.name,
          price: plan.price,
          features: plan.features,
          monthlyLimit,
          hasCourseAccess,
          remainingConsultations: monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - monthlyConsultations),
          currentUsage: monthlyConsultations,
          resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get available projects (public projects with plan-based access)
router.get('/projects', checkProjectAccess, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const query: any = { isPublic: true };
    const userPlanLevel = req.userPlanLevel;

    // Filter projects based on user's plan level
    if (userPlanLevel) {
      // Define plan hierarchy: basic < plus < complete
      const planHierarchy = ['basic', 'plus', 'complete'];
      const userPlanIndex = planHierarchy.indexOf(userPlanLevel);
      
      if (userPlanIndex !== -1) {
        // User can access projects that require their plan level or lower
        const accessiblePlans = planHierarchy.slice(0, userPlanIndex + 1);
        query.requiredPlan = { $in: accessiblePlans };
      }
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    const projects = await Project.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      data: {
        projects,
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

// Get project by ID
router.get('/projects/:id', checkProjectAccess, async (req, res, next) => {
  try {
    const userPlanLevel = req.userPlanLevel;
    const query: any = {
      _id: req.params.id,
      isPublic: true
    };

    // Filter project based on user's plan level
    if (userPlanLevel) {
      const planHierarchy = ['basic', 'plus', 'complete'];
      const userPlanIndex = planHierarchy.indexOf(userPlanLevel);
      
      if (userPlanIndex !== -1) {
        const accessiblePlans = planHierarchy.slice(0, userPlanIndex + 1);
        query.requiredPlan = { $in: accessiblePlans };
      }
    }

    const project = await Project.findOne(query).populate('createdBy', 'name');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found or not available for your subscription plan'
      });
    }

    res.json({
      success: true,
      data: { project }
    });
  } catch (error) {
    next(error);
  }
});

// Get customer's consultations
router.get('/consultations', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query: any = { customerId: req.user!._id };

    if (status) {
      query.status = status;
    }

    const consultations = await Consultation.find(query)
      .populate('lawyerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Consultation.countDocuments(query);

    res.json({
      success: true,
      data: {
        consultations,
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

// Get consultation by ID
router.get('/consultations/:id', async (req, res, next) => {
  try {
    const consultation = await Consultation.findOne({
      _id: req.params.id,
      customerId: req.user!._id
    }).populate('lawyerId', 'name email');

    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found or you do not have permission to view it'
      });
    }

    res.json({
      success: true,
      data: { consultation }
    });
  } catch (error) {
    next(error);
  }
});

// Create new consultation request
router.post('/consultations', checkConsultationLimits, validateConsultation, async (req, res, next) => {
  try {
    const { lawyerId, ...consultationData } = req.body;
    
    // If lawyerId is provided, verify the lawyer exists and is active
    if (lawyerId) {
      const lawyer = await User.findOne({ _id: lawyerId, role: 'lawyer', isActive: true });
      if (!lawyer) {
        return res.status(400).json({
          success: false,
          message: 'Selected lawyer not found or not available'
        });
      }
    }

    const consultation = new Consultation({
      ...consultationData,
      customerId: req.user!._id,
      lawyerId: lawyerId || undefined,
      status: lawyerId ? 'assigned' : 'pending',
      chatStatus: lawyerId ? 'active' : 'waiting_acceptance',
      requestedAt: new Date(),
      ...(lawyerId && { chatStartedAt: new Date() })
    });

    await consultation.save();

    // If lawyer was specified, create a system message
    if (lawyerId) {
      const systemMessage = new Message({
        consultationId: consultation._id,
        senderId: lawyerId,
        senderRole: 'lawyer',
        content: 'Consultation request received. Chat is now active.',
        messageType: 'system'
      });
      await systemMessage.save();
    }

    const populatedConsultation = await Consultation.findById(consultation._id)
      .populate('customerId', 'name email')
      .populate('lawyerId', 'name email');

    res.status(201).json({
      success: true,
      message: lawyerId ? 'Consultation request sent to lawyer successfully' : 'Consultation request submitted successfully',
      data: { consultation: populatedConsultation }
    });
  } catch (error) {
    next(error);
  }
});

// Get available lawyers for consultation requests
router.get('/lawyers', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, specialization } = req.query;
    const query: any = { role: 'lawyer', isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search as string, $options: 'i' } },
        { email: { $regex: search as string, $options: 'i' } }
      ];
    }

    // Note: specialization filter removed as specialization field doesn't exist in User model

    const lawyers = await User.find(query)
      .select('name email role lawyerStatus isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        lawyers,
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

// Get available courses (public courses, with plan access check)
router.get('/courses', checkCourseAccess, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, level, search } = req.query;
    const query: any = { isPublic: true };

    if (category) {
      query.category = category;
    }

    if (level) {
      query.level = level;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    const courses = await Course.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses,
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

// Get course by ID
router.get('/courses/:id', checkCourseAccess, async (req, res, next) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      isPublic: true
    }).populate('createdBy', 'name');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found or not available'
      });
    }

    res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    next(error);
  }
});

// Get available plans for upgrade
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 });

    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    next(error);
  }
});

// Get consultation statistics
router.get('/consultations/stats', async (req, res, next) => {
  try {
    const customerId = req.user!._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalConsultations,
      monthlyConsultations,
      completedConsultations,
      pendingConsultations,
      inProgressConsultations
    ] = await Promise.all([
      Consultation.countDocuments({ customerId }),
      Consultation.countDocuments({
        customerId,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }),
      Consultation.countDocuments({ customerId, status: 'completed' }),
      Consultation.countDocuments({ customerId, status: 'pending' }),
      Consultation.countDocuments({ customerId, status: 'in_progress' })
    ]);

    res.json({
      success: true,
      data: {
        totalConsultations,
        monthlyConsultations,
        completedConsultations,
        pendingConsultations,
        inProgressConsultations
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;