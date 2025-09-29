"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.use(auth_1.adminOnly);
router.get('/dashboard', async (req, res, next) => {
    try {
        const allUsers = await models_1.User.find({})
            .populate('planId')
            .select('-password')
            .sort({ createdAt: -1 });
        const roleOrder = { admin: 1, lawyer: 2, customer: 3 };
        const sortedUsers = allUsers.sort((a, b) => {
            const roleA = roleOrder[a.role] || 999;
            const roleB = roleOrder[b.role] || 999;
            if (roleA !== roleB) {
                return roleA - roleB;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        const recentUsers = sortedUsers.slice(0, 5).map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            lawyerStatus: user.lawyerStatus,
            plan: user.planId ? {
                id: user.planId._id,
                name: user.planId.name,
                price: user.planId.price
            } : null,
            createdAt: user.createdAt
        }));
        const totalUsers = await models_1.User.countDocuments();
        const totalAdmins = await models_1.User.countDocuments({ role: 'admin' });
        const totalLawyers = await models_1.User.countDocuments({ role: 'lawyer' });
        const totalCustomers = await models_1.User.countDocuments({ role: 'customer' });
        const totalProjects = await models_1.Project.countDocuments();
        const totalCourses = await models_1.Course.countDocuments();
        const recentProjects = await models_1.Project.find({})
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(3)
            .select('title description createdAt')
            .lean();
        const recentCourses = await models_1.Course.find({})
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(3)
            .select('title description createdAt')
            .lean();
        res.json({
            success: true,
            data: {
                recentUsers,
                totalUsers,
                totalAdmins,
                totalLawyers,
                totalCustomers,
                totalProjects,
                totalCourses,
                recentProjects,
                recentCourses
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/users', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, role, search, lawyerStatus } = req.query;
        const query = {};
        if (role) {
            query.role = role;
        }
        if (lawyerStatus) {
            query.lawyerStatus = lawyerStatus;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }
        const allUsers = await models_1.User.find(query)
            .populate('planId')
            .select('-password')
            .sort({ createdAt: -1 });
        const roleOrder = { admin: 1, lawyer: 2, customer: 3 };
        const sortedUsers = allUsers.sort((a, b) => {
            const roleA = roleOrder[a.role] || 999;
            const roleB = roleOrder[b.role] || 999;
            if (roleA !== roleB) {
                return roleA - roleB;
            }
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const users = sortedUsers.slice(startIndex, endIndex);
        const total = await models_1.User.countDocuments(query);
        res.json({
            success: true,
            data: {
                users,
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
router.get('/users/:id', async (req, res, next) => {
    try {
        const user = await models_1.User.findById(req.params.id).populate('planId');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            data: { user }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/users/:id', async (req, res, next) => {
    try {
        const { name, email, role, planId, isActive } = req.body;
        const user = await models_1.User.findByIdAndUpdate(req.params.id, { name, email, role, planId, isActive }, { new: true, runValidators: true }).populate('planId');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            message: 'User updated successfully',
            data: { user }
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/users/:id', async (req, res, next) => {
    try {
        const user = await models_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin users'
            });
        }
        await models_1.User.findByIdAndDelete(req.params.id);
        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/users/:id/approve-lawyer', async (req, res, next) => {
    try {
        const user = await models_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.lawyerStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'User is not in pending status'
            });
        }
        user.role = 'lawyer';
        user.lawyerStatus = 'approved';
        await user.save();
        res.json({
            success: true,
            message: 'Lawyer application approved successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    lawyerStatus: user.lawyerStatus
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/users/:id/reject-lawyer', async (req, res, next) => {
    try {
        const user = await models_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.lawyerStatus !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'User is not in pending status'
            });
        }
        user.role = 'customer';
        user.lawyerStatus = 'rejected';
        await user.save();
        res.json({
            success: true,
            message: 'Lawyer application rejected successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    lawyerStatus: user.lawyerStatus
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/users/:id/plan', async (req, res, next) => {
    try {
        const { planId } = req.body;
        const user = await models_1.User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        if (user.role !== 'customer') {
            return res.status(400).json({
                success: false,
                message: 'Only customers can have plans updated'
            });
        }
        const plan = await models_1.Plan.findById(planId);
        if (!plan) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan ID'
            });
        }
        user.planId = planId;
        await user.save();
        res.json({
            success: true,
            message: 'User plan updated successfully',
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    planId: user.planId
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/plans', async (req, res, next) => {
    try {
        const plans = await models_1.Plan.find().sort({ price: 1 });
        res.json({
            success: true,
            data: { plans }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/plans', async (req, res, next) => {
    try {
        const plan = new models_1.Plan(req.body);
        await plan.save();
        res.status(201).json({
            success: true,
            message: 'Plan created successfully',
            data: { plan }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/plans/:id', async (req, res, next) => {
    try {
        const plan = await models_1.Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }
        res.json({
            success: true,
            message: 'Plan updated successfully',
            data: { plan }
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/plans/:id', async (req, res, next) => {
    try {
        const plan = await models_1.Plan.findByIdAndDelete(req.params.id);
        if (!plan) {
            return res.status(404).json({
                success: false,
                message: 'Plan not found'
            });
        }
        res.json({
            success: true,
            message: 'Plan deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/consultations', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = {};
        if (status) {
            query.status = status;
        }
        const consultations = await models_1.Consultation.find(query)
            .populate('customerId', 'name email')
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
router.put('/consultations/:id/assign', async (req, res, next) => {
    try {
        const { lawyerId } = req.body;
        const consultation = await models_1.Consultation.findByIdAndUpdate(req.params.id, { lawyerId, status: 'assigned' }, { new: true }).populate('customerId', 'name email')
            .populate('lawyerId', 'name email');
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found'
            });
        }
        res.json({
            success: true,
            message: 'Consultation assigned successfully',
            data: { consultation }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/projects', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, category, search } = req.query;
        const query = {};
        if (category) {
            query.category = category;
        }
        if (search) {
            query.$text = { $search: search };
        }
        const projects = await models_1.Project.find(query)
            .populate('createdBy', 'name email')
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
router.post('/projects', async (req, res, next) => {
    try {
        const project = new models_1.Project({
            ...req.body,
            createdBy: req.user._id
        });
        await project.save();
        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: { project }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/projects/:id', async (req, res, next) => {
    try {
        const project = await models_1.Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('createdBy', 'name email');
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        res.json({
            success: true,
            message: 'Project updated successfully',
            data: { project }
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/projects/:id', async (req, res, next) => {
    try {
        const project = await models_1.Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        res.json({
            success: true,
            message: 'Project deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/courses', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, category, level, search } = req.query;
        const query = {};
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
            .populate('createdBy', 'name email')
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
router.post('/courses', async (req, res, next) => {
    try {
        const course = new models_1.Course({
            ...req.body,
            createdBy: req.user._id
        });
        await course.save();
        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: { course }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/courses/:id', async (req, res, next) => {
    try {
        const course = await models_1.Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('createdBy', 'name email');
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        res.json({
            success: true,
            message: 'Course updated successfully',
            data: { course }
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/courses/:id', async (req, res, next) => {
    try {
        const course = await models_1.Course.findByIdAndDelete(req.params.id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/dashboard', async (req, res, next) => {
    try {
        const [totalUsers, totalCustomers, totalLawyers, totalConsultations, pendingConsultations, totalProjects, totalCourses, recentUsers, recentConsultations] = await Promise.all([
            models_1.User.countDocuments(),
            models_1.User.countDocuments({ role: 'customer' }),
            models_1.User.countDocuments({ role: 'lawyer' }),
            models_1.Consultation.countDocuments(),
            models_1.Consultation.countDocuments({ status: 'pending' }),
            models_1.Project.countDocuments(),
            models_1.Course.countDocuments(),
            models_1.User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
            models_1.Consultation.find().sort({ createdAt: -1 }).limit(5).populate('customerId', 'name email').populate('lawyerId', 'name email')
        ]);
        res.json({
            success: true,
            data: {
                statistics: {
                    totalUsers,
                    totalCustomers,
                    totalLawyers,
                    totalConsultations,
                    pendingConsultations,
                    totalProjects,
                    totalCourses
                },
                recentUsers,
                recentConsultations
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/content', async (req, res, next) => {
    try {
        const projects = await models_1.Project.find({})
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();
        const courses = await models_1.Course.find({})
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();
        const formattedProjects = projects.map(project => ({
            id: project._id,
            title: project.title,
            description: project.description,
            createdAt: project.createdAt,
            authorName: project.createdBy?.name || 'Unknown'
        }));
        const formattedCourses = courses.map(course => ({
            id: course._id,
            title: course.title,
            description: course.description,
            videoUrl: course.videoUrl,
            thumbnailUrl: course.thumbnailUrl,
            createdAt: course.createdAt,
            authorName: course.createdBy?.name || 'Unknown'
        }));
        res.json({
            success: true,
            data: {
                projects: formattedProjects,
                courses: formattedCourses
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map