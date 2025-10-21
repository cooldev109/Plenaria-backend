import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/auth';
import User, { IUser } from '../models/User';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      tokenPayload?: TokenPayload;
    }
  }
}

/**
 * Middleware to require authentication
 * Verifies JWT token from Authorization header
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(payload.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if user is suspended
    if (user.status === 'SUSPENDED') {
      res.status(403).json({
        success: false,
        message: 'Account suspended',
      });
      return;
    }

    // Attach user and token payload to request
    req.user = user;
    req.tokenPayload = payload;

    next();
  } catch (error) {
    if (error instanceof Error) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
      return;
    }
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Middleware factory to require specific role(s)
 * Must be used after requireAuth middleware
 * @param roles - Array of allowed roles or single role string
 */
export const requireRole = (...roles: Array<'admin' | 'lawyer' | 'customer'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to check if lawyer is approved
 * Must be used after requireAuth middleware
 */
export const requireApprovedLawyer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'lawyer') {
    res.status(403).json({
      success: false,
      message: 'Lawyer role required',
    });
    return;
  }

  if (req.user.status !== 'ACTIVE') {
    res.status(403).json({
      success: false,
      message: 'Lawyer account pending approval',
    });
    return;
  }

  next();
};

/**
 * Middleware to check if customer has active plan
 * Must be used after requireAuth middleware
 */
export const requireActivePlan = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'customer') {
    next();
    return;
  }

  // Check if plan is expired
  if (req.user.planExpiresAt && new Date() > req.user.planExpiresAt) {
    res.status(403).json({
      success: false,
      message: 'Plan expired. Please renew your subscription.',
    });
    return;
  }

  next();
};

/**
 * Middleware to check if customer has specific plan level or higher
 * Must be used after requireAuth middleware
 * @param minPlan - Minimum plan required (basic, plus, or premium)
 */
export const requirePlan = (minPlan: 'basic' | 'plus' | 'premium') => {
  const planHierarchy: { [key: string]: number } = {
    basic: 1,
    plus: 2,
    premium: 3,
  };

  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Admin and lawyers have access to everything
    if (req.user.role === 'admin' || req.user.role === 'lawyer') {
      next();
      return;
    }

    // Check customer plan
    if (req.user.role === 'customer') {
      const userPlanLevel = planHierarchy[req.user.plan || 'basic'];
      const requiredPlanLevel = planHierarchy[minPlan];

      if (userPlanLevel < requiredPlanLevel) {
        res.status(403).json({
          success: false,
          message: `${minPlan} plan or higher required`,
        });
        return;
      }
    }

    next();
  };
};
