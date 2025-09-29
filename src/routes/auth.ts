import express, { Request, Response, NextFunction } from 'express';
import { User, Plan } from '../models';
import { generateToken } from '../utils/jwt';
import { authMiddleware } from '../middleware/auth';
import { validateUser, validateUserLogin, handleValidationErrors } from '../middleware/validation';

const router = express.Router();

// Register new user
router.post('/register', validateUser, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role = 'customer', planId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // For customers, assign Basic plan if no plan specified
    let finalPlanId = planId;
    if (role === 'customer' && !planId) {
      // Find the Basic plan (first plan in the database)
      const basicPlan = await Plan.findOne().sort({ price: 1 }); // Sort by price to get Basic plan first
      if (basicPlan) {
        finalPlanId = basicPlan._id;
      }
    }

    // If customer role, validate plan exists
    if (role === 'customer' && finalPlanId) {
      const plan = await Plan.findById(finalPlanId);
      if (!plan) {
        return res.status(400).json({
          success: false,
          message: 'Invalid plan ID'
        });
      }
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      planId: role === 'customer' ? finalPlanId : undefined
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    // Populate plan information for response
    const populatedUser = await User.findById(user._id).populate('planId', 'name price features');
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          planId: user.planId,
          plan: populatedUser?.planId
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', validateUserLogin, handleValidationErrors, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    console.log('🔍 Login attempt for email:', email);

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    console.log('👤 User found:', user ? 'Yes' : 'No');
    if (!user) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    console.log('✅ User is active:', user.isActive);
    if (!user.isActive) {
      console.log('❌ User account is deactivated');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    console.log('🔐 Verifying password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔐 Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('❌ Password verification failed');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          planId: user.planId
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!._id).populate('planId');
    
    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email } = req.body;
    const userId = req.user!._id;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user!.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/change-password', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
