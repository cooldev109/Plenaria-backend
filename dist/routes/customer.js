"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const planLimits_1 = require("../middleware/planLimits");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.use(auth_1.allRoles);
router.get('/dashboard', async (req, res, next) => {
    try {
        const customerId = req.user._id;
        const userPlanId = req.user.planId;
        let plan = null;
        if (userPlanId) {
            plan = await models_1.Plan.findById(userPlanId);
        }
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const [totalConsultations, monthlyConsultations, completedConsultations, pendingConsultations, recentConsultations, availableProjects, availableCourses] = await Promise.all([
            models_1.Consultation.countDocuments({ customerId }),
            models_1.Consultation.countDocuments({
                customerId,
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            }),
            models_1.Consultation.countDocuments({ customerId, status: 'completed' }),
            models_1.Consultation.countDocuments({ customerId, status: { $in: ['pending', 'assigned', 'in_progress'] } }),
            models_1.Consultation.find({ customerId })
                .populate('lawyerId', 'name email')
                .sort({ createdAt: -1 })
                .limit(5),
            models_1.Project.countDocuments({ isPublic: true }),
            models_1.Course.countDocuments({ isPublic: true })
        ]);
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
                    monthlyLimit = -1;
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/plan', async (req, res, next) => {
    try {
        const userPlanId = req.user.planId;
        if (!userPlanId) {
            return res.status(404).json({
                success: false,
                message: 'No subscription plan found'
            });
        }
        const plan = await models_1.Plan.findById(userPlanId);
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthlyConsultations = await models_1.Consultation.countDocuments({
            customerId: req.user._id,
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        });
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
                monthlyLimit = -1;
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/projects', planLimits_1.checkProjectAccess, async (req, res, next) => {
    try {
        const { page = 1, limit = 10, category, search } = req.query;
        const query = { isPublic: true };
        const userPlanLevel = req.userPlanLevel;
        if (userPlanLevel) {
            const planHierarchy = ['basic', 'plus', 'complete'];
            const userPlanIndex = planHierarchy.indexOf(userPlanLevel);
            if (userPlanIndex !== -1) {
                const accessiblePlans = planHierarchy.slice(0, userPlanIndex + 1);
                query.requiredPlan = { $in: accessiblePlans };
            }
        }
        if (category) {
            query.category = category;
        }
        if (search) {
            query.$text = { $search: search };
        }
        const projects = await models_1.Project.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit));
        const total = await models_1.Project.countDocuments(query);
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/projects/:id', planLimits_1.checkProjectAccess, async (req, res, next) => {
    try {
        const userPlanLevel = req.userPlanLevel;
        const query = {
            _id: req.params.id,
            isPublic: true
        };
        if (userPlanLevel) {
            const planHierarchy = ['basic', 'plus', 'complete'];
            const userPlanIndex = planHierarchy.indexOf(userPlanLevel);
            if (userPlanIndex !== -1) {
                const accessiblePlans = planHierarchy.slice(0, userPlanIndex + 1);
                query.requiredPlan = { $in: accessiblePlans };
            }
        }
        const project = await models_1.Project.findOne(query).populate('createdBy', 'name');
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/consultations', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = { customerId: req.user._id };
        if (status) {
            query.status = status;
        }
        const consultations = await models_1.Consultation.find(query)
            .populate('lawyerId', 'name email')
            .sort({ createdAt: -1 })
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit));
        const total = await models_1.Consultation.countDocuments(query);
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/consultations/:id', async (req, res, next) => {
    try {
        const consultation = await models_1.Consultation.findOne({
            _id: req.params.id,
            customerId: req.user._id
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/consultations', planLimits_1.checkConsultationLimits, validation_1.validateConsultation, async (req, res, next) => {
    try {
        const { lawyerId, ...consultationData } = req.body;
        if (lawyerId) {
            const lawyer = await models_1.User.findOne({ _id: lawyerId, role: 'lawyer', isActive: true });
            if (!lawyer) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected lawyer not found or not available'
                });
            }
        }
        const consultation = new models_1.Consultation({
            ...consultationData,
            customerId: req.user._id,
            lawyerId: lawyerId || undefined,
            status: lawyerId ? 'assigned' : 'pending',
            chatStatus: lawyerId ? 'active' : 'waiting_acceptance',
            requestedAt: new Date(),
            ...(lawyerId && { chatStartedAt: new Date() })
        });
        await consultation.save();
        if (lawyerId) {
            const systemMessage = new models_1.Message({
                consultationId: consultation._id,
                senderId: lawyerId,
                senderRole: 'lawyer',
                content: 'Consultation request received. Chat is now active.',
                messageType: 'system'
            });
            await systemMessage.save();
        }
        const populatedConsultation = await models_1.Consultation.findById(consultation._id)
            .populate('customerId', 'name email')
            .populate('lawyerId', 'name email');
        res.status(201).json({
            success: true,
            message: lawyerId ? 'Consultation request sent to lawyer successfully' : 'Consultation request submitted successfully',
            data: { consultation: populatedConsultation }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/lawyers', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, specialization } = req.query;
        const query = { role: 'lawyer', isActive: true };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const lawyers = await models_1.User.find(query)
            .select('name email role lawyerStatus isActive createdAt')
            .sort({ createdAt: -1 })
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit));
        const total = await models_1.User.countDocuments(query);
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/courses', planLimits_1.checkCourseAccess, async (req, res, next) => {
    try {
        const { page = 1, limit = 10, category, level, search } = req.query;
        const query = { isPublic: true };
        if (category) {
            query.category = category;
        }
        if (level) {
            query.level = level;
        }
        if (search) {
            query.$text = { $search: search };
        }
        const courses = await models_1.Course.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit));
        const total = await models_1.Course.countDocuments(query);
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/courses/:id', planLimits_1.checkCourseAccess, async (req, res, next) => {
    try {
        const course = await models_1.Course.findOne({
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/plans', async (req, res, next) => {
    try {
        const plans = await models_1.Plan.find({ isActive: true }).sort({ price: 1 });
        res.json({
            success: true,
            data: { plans }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/consultations/stats', async (req, res, next) => {
    try {
        const customerId = req.user._id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const [totalConsultations, monthlyConsultations, completedConsultations, pendingConsultations, inProgressConsultations] = await Promise.all([
            models_1.Consultation.countDocuments({ customerId }),
            models_1.Consultation.countDocuments({
                customerId,
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            }),
            models_1.Consultation.countDocuments({ customerId, status: 'completed' }),
            models_1.Consultation.countDocuments({ customerId, status: 'pending' }),
            models_1.Consultation.countDocuments({ customerId, status: 'in_progress' })
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
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=customer.js.map