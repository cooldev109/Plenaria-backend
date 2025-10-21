import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import ProjectTemplate from '../models/ProjectTemplate';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

/**
 * GET /api/templates
 * Get all project templates with filters
 * Accessible by all authenticated users based on their plan
 */
router.get(
  '/',
  requireAuth,
  [
    query('keyword').optional().trim(),
    query('category').optional().trim(),
    query('type').optional().isIn(['PL', 'motion', 'request', 'recommendation']),
    query('visibility').optional().isIn(['basic', 'plus', 'premium']),
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

      const { keyword, category, type, visibility, page = 1, limit = 20 } = req.query;

      // Build query based on user's plan
      const query: any = {};

      // Determine user's accessible visibility levels
      const planHierarchy: { [key: string]: string[] } = {
        basic: ['basic'],
        plus: ['basic', 'plus'],
        premium: ['basic', 'plus', 'premium'],
      };

      // Admin and lawyers have access to all
      let accessibleLevels = ['basic', 'plus', 'premium'];
      if (req.user?.role === 'customer') {
        accessibleLevels = planHierarchy[req.user.plan || 'basic'];
      }

      query.visibility = { $in: accessibleLevels };

      // Apply filters
      if (keyword) {
        query.$text = { $search: keyword as string };
      }

      if (category) {
        query.category = category;
      }

      if (type) {
        query.type = type;
      }

      if (visibility && accessibleLevels.includes(visibility as string)) {
        query.visibility = visibility;
      }

      // Pagination
      const skip = (Number(page) - 1) * Number(limit);

      // Execute query
      const templates = await ProjectTemplate.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await ProjectTemplate.countDocuments(query);

      return res.status(200).json({
        success: true,
        data: templates,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get templates error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch templates',
      });
    }
  }
);

/**
 * GET /api/templates/:id
 * Get a single template by ID
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const template = await ProjectTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Check if user has access to this visibility level
    const planHierarchy: { [key: string]: string[] } = {
      basic: ['basic'],
      plus: ['basic', 'plus'],
      premium: ['basic', 'plus', 'premium'],
    };

    let accessibleLevels = ['basic', 'plus', 'premium'];
    if (req.user?.role === 'customer') {
      accessibleLevels = planHierarchy[req.user.plan || 'basic'];
    }

    if (!accessibleLevels.includes(template.visibility)) {
      return res.status(403).json({
        success: false,
        message: `${template.visibility} plan required to access this template`,
      });
    }

    return res.status(200).json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Get template error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch template',
    });
  }
});

/**
 * POST /api/templates/:id/download
 * Track download and return file URL with caching headers
 */
router.post('/:id/download', requireAuth, async (req: Request, res: Response) => {
  try {
    const template = await ProjectTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    // Check access
    const planHierarchy: { [key: string]: string[] } = {
      basic: ['basic'],
      plus: ['basic', 'plus'],
      premium: ['basic', 'plus', 'premium'],
    };

    let accessibleLevels = ['basic', 'plus', 'premium'];
    if (req.user?.role === 'customer') {
      accessibleLevels = planHierarchy[req.user.plan || 'basic'];
    }

    if (!accessibleLevels.includes(template.visibility)) {
      return res.status(403).json({
        success: false,
        message: `${template.visibility} plan required to download this template`,
      });
    }

    // Increment download count
    template.downloadCount += 1;
    await template.save();

    // Set offline caching headers (cache for 7 days)
    res.set({
      'Cache-Control': 'public, max-age=604800',
      'ETag': `"${template._id}-${template.updatedAt.getTime()}"`,
    });

    return res.status(200).json({
      success: true,
      data: {
        fileUrl: template.fileUrl,
        filename: `${template.title}.${template.format}`,
        format: template.format,
      },
    });
  } catch (error) {
    console.error('Download template error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download template',
    });
  }
});

/**
 * POST /api/templates
 * Create a new template (admin only)
 */
router.post(
  '/',
  requireAuth,
  requireRole('admin'),
  [
    body('title').notEmpty().trim().withMessage('Title is required'),
    body('category').notEmpty().trim().withMessage('Category is required'),
    body('type')
      .isIn(['PL', 'motion', 'request', 'recommendation'])
      .withMessage('Invalid type'),
    body('fileUrl').notEmpty().isURL().withMessage('Valid file URL is required'),
    body('format').isIn(['pdf', 'docx', 'doc']).withMessage('Invalid format'),
    body('visibility')
      .isIn(['basic', 'plus', 'premium'])
      .withMessage('Invalid visibility level'),
    body('tags').optional().isArray(),
    body('description').optional().trim(),
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

      const template = await ProjectTemplate.create(req.body);

      return res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: template,
      });
    } catch (error) {
      console.error('Create template error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create template',
      });
    }
  }
);

/**
 * PUT /api/templates/:id
 * Update a template (admin only)
 */
router.put(
  '/:id',
  requireAuth,
  requireRole('admin'),
  [
    body('title').optional().trim(),
    body('category').optional().trim(),
    body('type').optional().isIn(['PL', 'motion', 'request', 'recommendation']),
    body('fileUrl').optional().isURL(),
    body('format').optional().isIn(['pdf', 'docx', 'doc']),
    body('visibility').optional().isIn(['basic', 'plus', 'premium']),
    body('tags').optional().isArray(),
    body('description').optional().trim(),
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

      const template = await ProjectTemplate.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: template,
      });
    } catch (error) {
      console.error('Update template error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update template',
      });
    }
  }
);

/**
 * DELETE /api/templates/:id
 * Delete a template (admin only)
 */
router.delete('/:id', requireAuth, requireRole('admin'), async (req: Request, res: Response) => {
  try {
    const template = await ProjectTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Delete template error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete template',
    });
  }
});

export default router;
