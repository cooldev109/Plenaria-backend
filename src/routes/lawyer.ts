import express from 'express';
import { Consultation, Project, Course, User, Draft } from '../models';
import { authMiddleware, lawyerOnly } from '../middleware/auth';
import { validateConsultation, validateProject, validateCourse } from '../middleware/validation';

const router = express.Router();

// Apply authentication and lawyer role middleware to all routes
router.use(authMiddleware);
router.use(lawyerOnly);

// Get assigned consultations
router.get('/consultations', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query: any = { lawyerId: req.user!._id };

    if (status) {
      query.status = status;
    }

    const consultations = await Consultation.find(query)
      .populate('customerId', 'name email')
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
      lawyerId: req.user!._id
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
  } catch (error) {
    next(error);
  }
});

// Update consultation status and response
router.put('/consultations/:id', async (req, res, next) => {
  try {
    const { status, response, notes } = req.body;
    const lawyerId = req.user!._id;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (response) updateData.response = response;
    if (notes) updateData.notes = notes;

    // If marking as completed, set completedAt and answeredAt
    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.answeredAt = new Date();
    }

    const consultation = await Consultation.findOneAndUpdate(
      { _id: req.params.id, lawyerId },
      updateData,
      { new: true, runValidators: true }
    ).populate('customerId', 'name email');

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
  } catch (error) {
    next(error);
  }
});

// Get available consultations (not assigned)
router.get('/consultations/available', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const consultations = await Consultation.find({
      status: 'pending',
      lawyerId: { $exists: false }
    })
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Consultation.countDocuments({
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
  } catch (error) {
    next(error);
  }
});

// Claim a consultation
router.post('/consultations/:id/claim', async (req, res, next) => {
  try {
    const consultation = await Consultation.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'pending',
        lawyerId: { $exists: false }
      },
      {
        lawyerId: req.user!._id,
        status: 'assigned'
      },
      { new: true }
    ).populate('customerId', 'name email');

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
  } catch (error) {
    next(error);
  }
});

// Get lawyer's projects
router.get('/projects', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const projects = await Project.find({ createdBy: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Project.countDocuments({ createdBy: req.user!._id });

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

// Create new project
router.post('/projects', validateProject, async (req, res, next) => {
  try {
    const project = new Project({
      ...req.body,
      createdBy: req.user!._id
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project }
    });
  } catch (error) {
    next(error);
  }
});

// Update project
router.put('/projects/:id', async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user!._id },
      req.body,
      { new: true, runValidators: true }
    );

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
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/projects/:id', async (req, res, next) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user!._id
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
  } catch (error) {
    next(error);
  }
});

// Get lawyer's courses
router.get('/courses', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const courses = await Course.find({ createdBy: req.user!._id })
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Course.countDocuments({ createdBy: req.user!._id });

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

// Create new course
router.post('/courses', validateCourse, async (req, res, next) => {
  try {
    const course = new Course({
      ...req.body,
      createdBy: req.user!._id
    });

    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
});

// Update course
router.put('/courses/:id', async (req, res, next) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user!._id },
      req.body,
      { new: true, runValidators: true }
    );

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
  } catch (error) {
    next(error);
  }
});

// Delete course
router.delete('/courses/:id', async (req, res, next) => {
  try {
    const course = await Course.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user!._id
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
  } catch (error) {
    next(error);
  }
});

// Get lawyer's drafts
router.get('/drafts', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type, category, search } = req.query;
    const query: any = { lawyerId: req.user!._id };

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    const drafts = await Draft.find(query)
      .populate('consultationId', 'subject customerId')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Draft.countDocuments(query);

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
  } catch (error) {
    next(error);
  }
});

// Create new draft
router.post('/drafts', async (req, res, next) => {
  try {
    const draft = new Draft({
      ...req.body,
      lawyerId: req.user!._id
    });

    await draft.save();

    res.status(201).json({
      success: true,
      message: 'Draft created successfully',
      data: { draft }
    });
  } catch (error) {
    next(error);
  }
});

// Get draft by ID
router.get('/drafts/:id', async (req, res, next) => {
  try {
    const draft = await Draft.findOne({
      _id: req.params.id,
      lawyerId: req.user!._id
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
  } catch (error) {
    next(error);
  }
});

// Update draft
router.put('/drafts/:id', async (req, res, next) => {
  try {
    const draft = await Draft.findOneAndUpdate(
      { _id: req.params.id, lawyerId: req.user!._id },
      req.body,
      { new: true, runValidators: true }
    ).populate('consultationId', 'subject customerId');

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
  } catch (error) {
    next(error);
  }
});

// Delete draft
router.delete('/drafts/:id', async (req, res, next) => {
  try {
    const draft = await Draft.findOneAndDelete({
      _id: req.params.id,
      lawyerId: req.user!._id
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
  } catch (error) {
    next(error);
  }
});

// Get lawyer dashboard statistics
router.get('/dashboard', async (req, res, next) => {
  try {
    const lawyerId = req.user!._id;

    const [
      assignedConsultations,
      completedConsultations,
      pendingConsultations,
      totalProjects,
      totalCourses,
      totalDrafts,
      recentConsultations
    ] = await Promise.all([
      Consultation.countDocuments({ lawyerId }),
      Consultation.countDocuments({ lawyerId, status: 'completed' }),
      Consultation.countDocuments({ lawyerId, status: 'pending' }),
      Project.countDocuments({ createdBy: lawyerId }),
      Course.countDocuments({ createdBy: lawyerId }),
      Draft.countDocuments({ lawyerId }),
      Consultation.find({ lawyerId })
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
  } catch (error) {
    next(error);
  }
});

export default router;
