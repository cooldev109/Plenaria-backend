"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkProjectAccess = exports.checkCourseAccess = exports.checkConsultationLimits = void 0;
const models_1 = require("../models");
const checkConsultationLimits = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;
        const userPlanId = req.user.planId;
        if (userRole === 'admin' || userRole === 'lawyer') {
            next();
            return;
        }
        if (!userPlanId) {
            res.status(400).json({
                success: false,
                message: 'No subscription plan found. Please subscribe to a plan to request consultations.'
            });
            return;
        }
        const plan = await models_1.Plan.findById(userPlanId);
        if (!plan) {
            res.status(400).json({
                success: false,
                message: 'Invalid subscription plan. Please contact support.'
            });
            return;
        }
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const consultationCount = await models_1.Consultation.countDocuments({
            customerId: userId,
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });
        let monthlyLimit;
        switch (plan.name.toLowerCase()) {
            case 'basic':
                monthlyLimit = 3;
                break;
            case 'plus':
                monthlyLimit = 5;
                break;
            case 'complete':
                monthlyLimit = -1;
                break;
            default:
                monthlyLimit = 0;
        }
        if (monthlyLimit === -1) {
            next();
            return;
        }
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
        req.consultationInfo = {
            currentCount: consultationCount,
            monthlyLimit,
            planName: plan.name,
            remainingConsultations: monthlyLimit - consultationCount
        };
        next();
    }
    catch (error) {
        console.error('Error checking consultation limits:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking consultation limits'
        });
    }
};
exports.checkConsultationLimits = checkConsultationLimits;
const checkCourseAccess = async (req, res, next) => {
    try {
        const userRole = req.user.role;
        const userPlanId = req.user.planId;
        if (userRole === 'admin' || userRole === 'lawyer') {
            next();
            return;
        }
        if (!userPlanId) {
            res.status(400).json({
                success: false,
                message: 'No subscription plan found. Please subscribe to a plan to access courses.'
            });
            return;
        }
        const plan = await models_1.Plan.findById(userPlanId);
        if (!plan) {
            res.status(400).json({
                success: false,
                message: 'Invalid subscription plan. Please contact support.'
            });
            return;
        }
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
    }
    catch (error) {
        console.error('Error checking course access:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking course access'
        });
    }
};
exports.checkCourseAccess = checkCourseAccess;
const checkProjectAccess = async (req, res, next) => {
    try {
        const userRole = req.user.role;
        const userPlanId = req.user.planId;
        if (userRole === 'admin' || userRole === 'lawyer') {
            next();
            return;
        }
        if (!userPlanId) {
            res.status(400).json({
                success: false,
                message: 'No subscription plan found. Please subscribe to a plan to access projects.'
            });
            return;
        }
        const plan = await models_1.Plan.findById(userPlanId);
        if (!plan) {
            res.status(400).json({
                success: false,
                message: 'Invalid subscription plan. Please contact support.'
            });
            return;
        }
        if (!plan.hasProjectDatabase) {
            res.status(403).json({
                success: false,
                message: 'Project access requires a subscription plan that includes project database access.'
            });
            return;
        }
        req.userPlanLevel = plan.name.toLowerCase().replace('básico', 'basic').replace('completo', 'complete');
        next();
    }
    catch (error) {
        console.error('Error checking project access:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking project access'
        });
    }
};
exports.checkProjectAccess = checkProjectAccess;
//# sourceMappingURL=planLimits.js.map