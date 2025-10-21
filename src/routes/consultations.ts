import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { requireAuth, requireRole } from '../middleware/auth';
import {
  createConsultation,
  getConsultations,
  getConsultation,
  getQuota,
  acceptConsultation,
  rejectConsultation,
  getMessages,
  cancelConsultation,
} from '../controllers/consultationsController';

const router = Router();

/**
 * POST /api/consultations
 * Create a new consultation request (customer only)
 */
router.post(
  '/',
  requireAuth,
  requireRole('customer'),
  [
    body('title').optional().trim(),
    body('description').optional().trim(),
    body('question').optional().trim(),
    body('lawyerId').optional().isMongoId().withMessage('Invalid lawyer ID'),
    body('attachments').optional().isArray(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    // Ensure at least one of description or question is provided
    if (!req.body.description && !req.body.question) {
      return res.status(400).json({
        success: false,
        message: 'Either description or question is required',
      });
    }

    return createConsultation(req, res);
  }
);

/**
 * GET /api/consultations
 * Get consultations list (filtered by role)
 */
router.get(
  '/',
  requireAuth,
  [
    query('status')
      .optional()
      .isIn(['REQUESTED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  getConsultations
);

/**
 * GET /api/consultations/quota
 * Get customer's consultation quota information
 */
router.get('/quota', requireAuth, requireRole('customer'), getQuota);

/**
 * GET /api/consultations/:id
 * Get a single consultation with messages
 */
router.get('/:id', requireAuth, getConsultation);

/**
 * POST /api/consultations/:id/accept
 * Accept a consultation request (lawyer only)
 */
router.post('/:id/accept', requireAuth, requireRole('lawyer'), acceptConsultation);

/**
 * POST /api/consultations/:id/reject
 * Reject a consultation request (lawyer only)
 */
router.post(
  '/:id/reject',
  requireAuth,
  requireRole('lawyer'),
  [body('reason').optional().trim()],
  rejectConsultation
);

/**
 * GET /api/consultations/:id/messages
 * Get all messages for a consultation
 */
router.get('/:id/messages', requireAuth, getMessages);

/**
 * DELETE /api/consultations/:id
 * Cancel a consultation (customer only, before it's accepted)
 */
router.delete('/:id', requireAuth, requireRole('customer'), cancelConsultation);

export default router;
