"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const models_1 = require("../models");
const jwt_1 = require("../utils/jwt");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
router.post('/register', validation_1.validateUser, validation_1.handleValidationErrors, async (req, res, next) => {
    try {
        const { name, email, password, role = 'customer', planId } = req.body;
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }
        let finalPlanId = planId;
        if (role === 'customer' && !planId) {
            const basicPlan = await models_1.Plan.findOne().sort({ price: 1 });
            if (basicPlan) {
                finalPlanId = basicPlan._id;
            }
        }
        if (role === 'customer' && finalPlanId) {
            const plan = await models_1.Plan.findById(finalPlanId);
            if (!plan) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid plan ID'
                });
            }
        }
        const user = new models_1.User({
            name,
            email,
            password,
            role,
            planId: role === 'customer' ? finalPlanId : undefined
        });
        await user.save();
        const token = (0, jwt_1.generateToken)(user);
        const populatedUser = await models_1.User.findById(user._id).populate('planId', 'name price features');
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/login', validation_1.validateUserLogin, validation_1.handleValidationErrors, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        console.log('🔍 Login attempt for email:', email);
        const user = await models_1.User.findOne({ email }).select('+password');
        console.log('👤 User found:', user ? 'Yes' : 'No');
        if (!user) {
            console.log('❌ User not found for email:', email);
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        console.log('✅ User is active:', user.isActive);
        if (!user.isActive) {
            console.log('❌ User account is deactivated');
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }
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
        const token = (0, jwt_1.generateToken)(user);
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/me', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const user = await models_1.User.findById(req.user._id).populate('planId');
        res.json({
            success: true,
            data: {
                user
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/me', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { name, email } = req.body;
        const userId = req.user._id;
        if (email && email !== req.user.email) {
            const existingUser = await models_1.User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email is already taken'
                });
            }
        }
        const updatedUser = await models_1.User.findByIdAndUpdate(userId, { name, email }, { new: true, runValidators: true });
        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: updatedUser
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/change-password', auth_1.authMiddleware, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user._id;
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
        const user = await models_1.User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        user.password = newPassword;
        await user.save();
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map