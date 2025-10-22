import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import {
  hashPassword,
  comparePassword,
  generateTokenPair,
  verifyRefreshToken,
} from '../utils/auth';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * POST /auth/register
 * Register a new user (customer or lawyer)
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('role').isIn(['customer', 'lawyer']).withMessage('Role must be customer or lawyer'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('plan')
      .optional()
      .isIn(['basic', 'plus', 'premium'])
      .withMessage('Plan must be basic, plus, or premium'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { email, password, role, phone, plan } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered',
        });
      }

      // Hash password (12 rounds as per security requirements)
      const passwordHash = await hashPassword(password);

      // Create user object
      const userData: any = {
        email,
        passwordHash,
        role,
      };

      if (phone) {
        userData.phone = phone;
      }

      // Customers require a plan
      if (role === 'customer') {
        if (!plan) {
          return res.status(400).json({
            success: false,
            message: 'Plan is required for customer registration',
          });
        }
        userData.plan = plan;

        // Set 7-day free trial for new customers
        userData.isOnTrial = true;
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + 7);
        userData.trialExpiresAt = trialExpiry;
      }

      // Create user
      const user = await User.create(userData);

      // If lawyer, send notification (console log for now)
      if (role === 'lawyer') {
        console.warn(`[ADMIN NOTIFICATION] New lawyer registration pending approval: ${email}`);
      }

      // Generate tokens
      const tokens = generateTokenPair(user);

      // Return response
      return res.status(201).json({
        success: true,
        message:
          role === 'lawyer'
            ? 'Registration submitted. Awaiting admin approval.'
            : 'Registration successful',
        user: user.toJSON(),
        ...tokens,
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({
        success: false,
        message: 'Registration failed',
      });
    }
  }
);

/**
 * POST /auth/login
 * Login with email or phone and password
 */
router.post(
  '/login',
  [
    body('identifier')
      .notEmpty()
      .withMessage('Email or phone is required')
      .trim(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { identifier, password } = req.body;

      // Find user by email or phone
      const user = await User.findOne({
        $or: [{ email: identifier }, { phone: identifier }],
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check password
      const isPasswordValid = await comparePassword(password, user.passwordHash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if account is suspended
      if (user.status === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          message: 'Account suspended. Please contact support.',
        });
      }

      // Generate tokens
      const tokens = generateTokenPair(user);

      // Return response
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: user.toJSON(),
        ...tokens,
        isPending: user.status === 'PENDING',
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Login failed',
      });
    }
  }
);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  async (req: Request, res: Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { refreshToken } = req.body;

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Get user from database
      const user = await User.findById(payload.userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if account is suspended
      if (user.status === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          message: 'Account suspended',
        });
      }

      // Generate new token pair
      const tokens = generateTokenPair(user);

      return res.status(200).json({
        success: true,
        ...tokens,
      });
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }
  }
);

/**
 * POST /auth/logout
 * Logout (client-side token removal, server logs for monitoring)
 */
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    // In a production app with token blacklisting, add token to blacklist here
    // For now, we rely on client-side token removal

    console.warn(`[AUTH] User logged out: ${req.user?.email}`);

    return res.status(200).json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user?.toJSON(),
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get user info',
    });
  }
});

/**
 * GET /auth/lawyers
 * Get list of active lawyers for consultation selection
 */
router.get('/lawyers', requireAuth, async (_req: Request, res: Response) => {
  try {
    const lawyers = await User.find({
      role: 'lawyer',
      status: 'ACTIVE',
    }).select('email _id').sort({ email: 1 });

    return res.status(200).json(lawyers);
  } catch (error) {
    console.error('Get lawyers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get lawyers list',
    });
  }
});

export default router;
