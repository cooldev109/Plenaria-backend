import { Request, Response, NextFunction } from 'express';
import { Consultation, Plan } from '../models';

// Middleware to check consultation limits based on user's plan
export const checkConsultationLimits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const userRole = req.user!.role;
    const userPlanId = req.user!.planId;

    // Admin and lawyer users have unlimited access
    if (userRole === 'admin' || userRole === 'lawyer') {
      next();
      return;
    }

    // For customers, check plan restrictions
    if (!userPlanId) {
      res.status(400).json({
        success: false,
        message: 'No subscription plan found. Please subscribe to a plan to request consultations.'
      });
      return;
    }

    // Get user's plan details
    const plan = await Plan.findById(userPlanId);
    if (!plan) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription plan. Please contact support.'
      });
      return;
    }

    // Get current month's consultation count
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const consultationCount = await Consultation.countDocuments({
      customerId: userId,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    // Check limits based on plan
    let monthlyLimit: number;
    switch (plan.name.toLowerCase()) {
      case 'basic':
        monthlyLimit = 50; // Increased for testing
        break;
      case 'plus':
        monthlyLimit = 100; // Increased for testing
        break;
      case 'complete':
        monthlyLimit = -1; // Unlimited
        break;
      default:
        monthlyLimit = 10; // Default limit for testing
    }

    // If unlimited (complete plan), allow
    if (monthlyLimit === -1) {
      next();
      return;
    }

    // Check if user has exceeded their limit
    if (consultationCount >= monthlyLimit) {
      res.status(403).json({
        success: false,
        message: `You have reached your monthly consultation limit of ${monthlyLimit} consultations. Upgrade your plan for more consultations.`,
        data: {
          currentCount: consultationCount,
          monthlyLimit,
          planName: plan.name,
          resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1)
        }
      });
      return;
    }

    // Add consultation info to request for use in the route handler
    req.consultationInfo = {
      currentCount: consultationCount,
      monthlyLimit,
      planName: plan.name,
      remainingConsultations: monthlyLimit - consultationCount
    };

    next();
  } catch (error) {
    console.error('Error checking consultation limits:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking consultation limits'
    });
  }
};

// Middleware to check course access based on plan
export const checkCourseAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRole = req.user!.role;
    const userPlanId = req.user!.planId;

    // Admin and lawyer users have full access to courses
    if (userRole === 'admin' || userRole === 'lawyer') {
      next();
      return;
    }

    // For customers, check plan access
    if (!userPlanId) {
      res.status(400).json({
        success: false,
        message: 'No subscription plan found. Please subscribe to a plan to access courses.'
      });
      return;
    }

    // Get user's plan details
    const plan = await Plan.findById(userPlanId);
    if (!plan) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription plan. Please contact support.'
      });
      return;
    }

    // Check if plan includes course access
    const hasCourseAccess = plan.name.toLowerCase() === 'complete' || plan.name.toLowerCase() === 'completo';

    if (!hasCourseAccess) {
      res.status(403).json({
        success: false,
        message: 'Course access requires a Complete plan subscription. Please upgrade your plan.',
        data: {
          planName: plan.name,
          requiredPlan: 'Complete'
        }
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Error checking course access:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking course access'
    });
  }
};

// Middleware to check project access based on plan
export const checkProjectAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userRole = req.user!.role;
    const userPlanId = req.user!.planId;

    // Admin and lawyer users have full access to projects
    if (userRole === 'admin' || userRole === 'lawyer') {
      next();
      return;
    }

    // For customers, check plan access
    if (!userPlanId) {
      res.status(400).json({
        success: false,
        message: 'No subscription plan found. Please subscribe to a plan to access projects.'
      });
      return;
    }

    // Get user's plan details
    const plan = await Plan.findById(userPlanId);
    if (!plan) {
      res.status(400).json({
        success: false,
        message: 'Invalid subscription plan. Please contact support.'
      });
      return;
    }

    // Check if plan includes project database access
    if (!plan.hasProjectDatabase) {
      res.status(403).json({
        success: false,
        message: 'Project access requires a subscription plan that includes project database access.'
      });
      return;
    }

    // Store user plan level for filtering projects
    req.userPlanLevel = plan.name.toLowerCase().replace('básico', 'basic').replace('completo', 'complete');
    
    next();
  } catch (error) {
    console.error('Error checking project access:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking project access'
    });
  }
};

// Extend Request interface to include consultation and project info
declare global {
  namespace Express {
    interface Request {
      consultationInfo?: {
        currentCount: number;
        monthlyLimit: number;
        planName: string;
        remainingConsultations: number;
      };
      userPlanLevel?: string;
    }
  }
}