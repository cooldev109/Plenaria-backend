"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.use(auth_1.lawyerOnly);
router.get('/consultations', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const query = { lawyerId: req.user._id };
        if (status) {
            query.status = status;
        }
        const consultations = await models_1.Consultation.find(query)
            .populate('customerId', 'name email')
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
            lawyerId: req.user._id
        }).populate('customerId', 'name email');
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found or not assigned to you'
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
router.put('/consultations/:id', async (req, res, next) => {
    try {
        const { status, response, notes } = req.body;
        const lawyerId = req.user._id;
        const updateData = {};
        if (status)
            updateData.status = status;
        if (response)
            updateData.response = response;
        if (notes)
            updateData.notes = notes;
        if (status === 'completed') {
            updateData.completedAt = new Date();
            updateData.answeredAt = new Date();
        }
        const consultation = await models_1.Consultation.findOneAndUpdate({ _id: req.params.id, lawyerId }, updateData, { new: true, runValidators: true }).populate('customerId', 'name email');
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found or not assigned to you'
            });
        }
        res.json({
            success: true,
            message: 'Consultation updated successfully',
            data: { consultation }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/consultations/available', async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const consultations = await models_1.Consultation.find({
            status: 'pending',
            lawyerId: { $exists: false }
        })
            .populate('customerId', 'name email')
            .sort({ createdAt: -1 })
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit));
        const total = await models_1.Consultation.countDocuments({
            status: 'pending',
            lawyerId: { $exists: false }
        });
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
router.post('/consultations/:id/claim', async (req, res, next) => {
    try {
        const consultation = await models_1.Consultation.findOneAndUpdate({
            _id: req.params.id,
            status: 'pending',
            lawyerId: { $exists: false }
        }, {
            lawyerId: req.user._id,
            status: 'assigned'
        }, { new: true }).populate('customerId', 'name email');
        if (!consultation) {
            return res.status(404).json({
                success: false,
                message: 'Consultation not found or already assigned'
            });
        }
        res.json({
            success: true,
            message: 'Consultation claimed successfully',
            data: { consultation }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/projects', async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const projects = await models_1.Project.find({ createdBy: req.user._id })
            .sort({ createdAt: -1 })
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit));
        const total = await models_1.Project.countDocuments({ createdBy: req.user._id });
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
router.post('/projects', validation_1.validateProject, async (req, res, next) => {
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
        const project = await models_1.Project.findOneAndUpdate({ _id: req.params.id, createdBy: req.user._id }, req.body, { new: true, runValidators: true });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or you do not have permission to update it'
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
        const project = await models_1.Project.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user._id
        });
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found or you do not have permission to delete it'
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
        const { page = 1, limit = 10 } = req.query;
        const courses = await models_1.Course.find({ createdBy: req.user._id })
            .sort({ createdAt: -1 })
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit));
        const total = await models_1.Course.countDocuments({ createdBy: req.user._id });
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
router.post('/courses', validation_1.validateCourse, async (req, res, next) => {
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
        const course = await models_1.Course.findOneAndUpdate({ _id: req.params.id, createdBy: req.user._id }, req.body, { new: true, runValidators: true });
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found or you do not have permission to update it'
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
        const course = await models_1.Course.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user._id
        });
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found or you do not have permission to delete it'
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
router.get('/drafts', async (req, res, next) => {
    try {
        const { page = 1, limit = 10, type, category, search } = req.query;
        const query = { lawyerId: req.user._id };
        if (type) {
            query.type = type;
        }
        if (category) {
            query.category = category;
        }
        if (search) {
            query.$text = { $search: search };
        }
        const drafts = await models_1.Draft.find(query)
            .populate('consultationId', 'subject customerId')
            .sort({ createdAt: -1 })
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit));
        const total = await models_1.Draft.countDocuments(query);
        res.json({
            success: true,
            data: {
                drafts,
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
router.post('/drafts', async (req, res, next) => {
    try {
        const draft = new models_1.Draft({
            ...req.body,
            lawyerId: req.user._id
        });
        await draft.save();
        res.status(201).json({
            success: true,
            message: 'Draft created successfully',
            data: { draft }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/drafts/:id', async (req, res, next) => {
    try {
        const draft = await models_1.Draft.findOne({
            _id: req.params.id,
            lawyerId: req.user._id
        }).populate('consultationId', 'subject customerId');
        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found or you do not have permission to view it'
            });
        }
        res.json({
            success: true,
            data: { draft }
        });
    }
    catch (error) {
        next(error);
    }
});
router.put('/drafts/:id', async (req, res, next) => {
    try {
        const draft = await models_1.Draft.findOneAndUpdate({ _id: req.params.id, lawyerId: req.user._id }, req.body, { new: true, runValidators: true }).populate('consultationId', 'subject customerId');
        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found or you do not have permission to update it'
            });
        }
        res.json({
            success: true,
            message: 'Draft updated successfully',
            data: { draft }
        });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/drafts/:id', async (req, res, next) => {
    try {
        const draft = await models_1.Draft.findOneAndDelete({
            _id: req.params.id,
            lawyerId: req.user._id
        });
        if (!draft) {
            return res.status(404).json({
                success: false,
                message: 'Draft not found or you do not have permission to delete it'
            });
        }
        res.json({
            success: true,
            message: 'Draft deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/dashboard', async (req, res, next) => {
    try {
        const lawyerId = req.user._id;
        const [assignedConsultations, completedConsultations, pendingConsultations, totalProjects, totalCourses, totalDrafts, recentConsultations] = await Promise.all([
            models_1.Consultation.countDocuments({ lawyerId }),
            models_1.Consultation.countDocuments({ lawyerId, status: 'completed' }),
            models_1.Consultation.countDocuments({ lawyerId, status: 'pending' }),
            models_1.Project.countDocuments({ createdBy: lawyerId }),
            models_1.Course.countDocuments({ createdBy: lawyerId }),
            models_1.Draft.countDocuments({ lawyerId }),
            models_1.Consultation.find({ lawyerId })
                .populate('customerId', 'name email')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);
        res.json({
            success: true,
            data: {
                statistics: {
                    assignedConsultations,
                    completedConsultations,
                    pendingConsultations,
                    totalProjects,
                    totalCourses,
                    totalDrafts
                },
                recentConsultations
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=lawyer.js.map