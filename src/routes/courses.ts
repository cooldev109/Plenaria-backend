import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import Course from '../models/Course';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * GET /api/courses
 * Get all courses with filtering based on user plan
 * Free intro modules accessible to all
 * Premium courses require premium plan
 */
router.get(
  '/',
  requireAuth,
  [
    query('keyword').optional().trim(),
    query('category').optional().trim(),
    query('visibility').optional().isIn(['free', 'premium']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
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

      const { keyword, category, visibility, page = 1, limit = 20 } = req.query;

      // Build query based on user's plan
      const query: any = {};

      // Determine accessible content
      // Admins and lawyers can access all
      // Premium customers can access all
      // Non-premium customers can only access free intro modules
      if (req.user?.role === 'customer' && req.user.plan !== 'premium') {
        // Non-premium customers only see free/intro courses
        query.$or = [{ visibility: 'free' }, { isIntroModule: true }];
      } else if (visibility) {
        // Filter by specific visibility if requested
        query.visibility = visibility;
      }

      // Apply filters
      if (keyword) {
        query.$text = { $search: keyword as string };
      }

      if (category) {
        query.category = category;
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);

      // Execute query
      const courses = await Course.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Course.countDocuments(query);

      return res.status(200).json({
        success: true,
        data: courses,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get courses error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch courses',
      });
    }
  }
);

/**
 * GET /api/courses/:id
 * Get a single course by ID
 * Access control based on plan
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check access permissions
    // Free or intro courses: accessible to all
    // Premium courses: require premium plan (or admin/lawyer)
    if (
      course.visibility === 'premium' &&
      !course.isIntroModule &&
      req.user?.role === 'customer' &&
      req.user.plan !== 'premium'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Premium plan required to access this course',
      });
    }

    // Increment view count
    course.viewCount += 1;
    await course.save();

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error('Get course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
    });
  }
});

/**
 * POST /api/courses
 * Create a new course (admin only)
 */
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  [
    body('title').notEmpty().trim().withMessage('Title is required'),
    body('description').notEmpty().trim().withMessage('Description is required'),
    body('videoUrl').notEmpty().isURL().withMessage('Valid video URL is required'),
    body('thumbnailUrl').optional().isURL().withMessage('Thumbnail must be a valid URL'),
    body('materials').optional().isArray(),
    body('visibility').isIn(['free', 'premium']).withMessage('Invalid visibility'),
    body('duration').optional().isInt({ min: 1 }),
    body('category').optional().trim(),
    body('tags').optional().isArray(),
    body('isIntroModule').optional().isBoolean(),
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

      const course = await Course.create(req.body);

      return res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course,
      });
    } catch (error) {
      console.error('Create course error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create course',
      });
    }
  }
);

/**
 * PUT /api/courses/:id
 * Update a course (admin only)
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  [
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('videoUrl').optional().isURL(),
    body('thumbnailUrl').optional().isURL(),
    body('materials').optional().isArray(),
    body('visibility').optional().isIn(['free', 'premium']),
    body('duration').optional().isInt({ min: 1 }),
    body('category').optional().trim(),
    body('tags').optional().isArray(),
    body('isIntroModule').optional().isBoolean(),
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

      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Course updated successfully',
        data: course,
      });
    } catch (error) {
      console.error('Update course error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update course',
      });
    }
  }
);

/**
 * POST /api/courses/:id/view
 * Increment view count for a course
 */
router.post('/:id/view', requireAuth, async (req: Request, res: Response) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Increment view count
    course.viewCount += 1;
    await course.save();

    return res.status(200).json({
      success: true,
      message: 'View count incremented',
      data: { viewCount: course.viewCount },
    });
  } catch (error) {
    console.error('Increment view count error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to increment view count',
    });
  }
});

/**
 * DELETE /api/courses/:id
 * Delete a course (admin only)
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete course',
    });
  }
});

export default router;
