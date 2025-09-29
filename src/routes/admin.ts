import express from 'express';
import { User, Plan, Consultation, Project, Course } from '../models';
import { authMiddleware, adminOnly } from '../middleware/auth';
import { validateUser, validateConsultation, validateProject, validateCourse } from '../middleware/validation';

const router = express.Router();

// Apply authentication and admin role middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

// Dashboard endpoint
router.get('/dashboard', async (req, res, next) => {
  try {
    // Get recent users (last 5) with role-based sorting
    const allUsers = await User.find({})
      .populate('planId')
      .select('-password')
      .sort({ createdAt: -1 });

    // Custom sort: Admin → Lawyer → Customer, newest first within each role
    const roleOrder = { admin: 1, lawyer: 2, customer: 3 };
    const sortedUsers = allUsers.sort((a, b) => {
      const roleA = roleOrder[a.role as keyof typeof roleOrder] || 999;
      const roleB = roleOrder[b.role as keyof typeof roleOrder] || 999;
      
      if (roleA !== roleB) {
        return roleA - roleB; // Sort by role priority
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first within role
    });

    const recentUsers = sortedUsers.slice(0, 5).map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      lawyerStatus: user.lawyerStatus,
      plan: user.planId ? {
        id: (user.planId as any)._id,
        name: (user.planId as any).name,
        price: (user.planId as any).price
      } : null,
      createdAt: user.createdAt
    }));

    // Get user counts by role
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalLawyers = await User.countDocuments({ role: 'lawyer' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Get content counts
    const totalProjects = await Project.countDocuments();
    const totalCourses = await Course.countDocuments();

    // Get recent projects (last 3)
    const recentProjects = await Project.find({})
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(3)
      .select('title description createdAt')
      .lean();

    // Get recent courses (last 3)
    const recentCourses = await Course.find({})
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
  } catch (error) {
    next(error);
  }
});

// Get all users with lawyer status
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search, lawyerStatus } = req.query;
    const query: any = {};

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

    // Get all users first, then sort manually: Admin → Lawyer → Customer
    const allUsers = await User.find(query)
      .populate('planId')
      .select('-password')
      .sort({ createdAt: -1 }); // Newest first

    // Custom sort: Admin → Lawyer → Customer
    const roleOrder = { admin: 1, lawyer: 2, customer: 3 };
    const sortedUsers = allUsers.sort((a, b) => {
      const roleA = roleOrder[a.role as keyof typeof roleOrder] || 999;
      const roleB = roleOrder[b.role as keyof typeof roleOrder] || 999;
      
      if (roleA !== roleB) {
        return roleA - roleB; // Sort by role priority
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Newest first within role
    });

    // Apply pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const users = sortedUsers.slice(startIndex, endIndex);

    const total = await User.countDocuments(query);

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
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('planId');
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
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/users/:id', async (req, res, next) => {
  try {
    const { name, email, role, planId, isActive } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, planId, isActive },
      { new: true, runValidators: true }
    ).populate('planId');

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
  } catch (error) {
    next(error);
  }
});

// Delete user (prevent admin deletion)
router.delete('/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin deletion
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Approve lawyer application
router.patch('/users/:id/approve-lawyer', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
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
  } catch (error) {
    next(error);
  }
});

// Reject lawyer application
router.patch('/users/:id/reject-lawyer', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
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
  } catch (error) {
    next(error);
  }
});

// Update user plan (for customers)
router.patch('/users/:id/plan', async (req, res, next) => {
  try {
    const { planId } = req.body;
    const user = await User.findById(req.params.id);
    
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

    // Verify plan exists
    const plan = await Plan.findById(planId);
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
  } catch (error) {
    next(error);
  }
});

// Get all plans
router.get('/plans', async (req, res, next) => {
  try {
    const plans = await Plan.find().sort({ price: 1 });
    res.json({
      success: true,
      data: { plans }
    });
  } catch (error) {
    next(error);
  }
});

// Create new plan
router.post('/plans', async (req, res, next) => {
  try {
    const plan = new Plan(req.body);
    await plan.save();

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: { plan }
    });
  } catch (error) {
    next(error);
  }
});

// Update plan
router.put('/plans/:id', async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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
  } catch (error) {
    next(error);
  }
});

// Delete plan
router.delete('/plans/:id', async (req, res, next) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
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
  } catch (error) {
    next(error);
  }
});

// Get all consultations
router.get('/consultations', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query: any = {};

    if (status) {
      query.status = status;
    }

    const consultations = await Consultation.find(query)
      .populate('customerId', 'name email')
      .populate('lawyerId', 'name email')
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

// Assign consultation to lawyer
router.put('/consultations/:id/assign', async (req, res, next) => {
  try {
    const { lawyerId } = req.body;
    
    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { lawyerId, status: 'assigned' },
      { new: true }
    ).populate('customerId', 'name email')
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
  } catch (error) {
    next(error);
  }
});

// Get all projects
router.get('/projects', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, search } = req.query;
    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    const projects = await Project.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Project.countDocuments(query);

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
router.post('/projects', async (req, res, next) => {
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
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

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
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/projects/:id', async (req, res, next) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
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
  } catch (error) {
    next(error);
  }
});

// Get all courses
router.get('/courses', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, level, search } = req.query;
    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (level) {
      query.level = level;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    const courses = await Course.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Course.countDocuments(query);

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
router.post('/courses', async (req, res, next) => {
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
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

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
  } catch (error) {
    next(error);
  }
});

// Delete course
router.delete('/courses/:id', async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
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
  } catch (error) {
    next(error);
  }
});

// Get dashboard statistics
router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalLawyers,
      totalConsultations,
      pendingConsultations,
      totalProjects,
      totalCourses,
      recentUsers,
      recentConsultations
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'lawyer' }),
      Consultation.countDocuments(),
      Consultation.countDocuments({ status: 'pending' }),
      Project.countDocuments(),
      Course.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
      Consultation.find().sort({ createdAt: -1 }).limit(5).populate('customerId', 'name email').populate('lawyerId', 'name email')
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
  } catch (error) {
    next(error);
  }
});

// Get unified content (projects and courses)
router.get('/content', async (req, res, next) => {
  try {
    // Fetch projects with author information
    const projects = await Project.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch courses with author information
    const courses = await Course.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Format projects
    const formattedProjects = projects.map(project => ({
      id: project._id,
      title: project.title,
      description: project.description,
      createdAt: project.createdAt,
      authorName: (project.createdBy as any)?.name || 'Unknown'
    }));

    // Format courses
    const formattedCourses = courses.map(course => ({
      id: course._id,
      title: course.title,
      description: course.description,
      videoUrl: course.videoUrl,
      thumbnailUrl: course.thumbnailUrl,
      createdAt: course.createdAt,
      authorName: (course.createdBy as any)?.name || 'Unknown'
    }));

    res.json({
      success: true,
      data: {
        projects: formattedProjects,
        courses: formattedCourses
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
