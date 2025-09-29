import { Request, Response, NextFunction } from 'express';
import { validationResult, body, param, query } from 'express-validator';
import { Types } from 'mongoose';

// Sanitization helpers
export const sanitizeString = (value: string): string => {
  return value.trim().replace(/[<>]/g, '');
};

export const sanitizeEmail = (value: string): string => {
  return value.trim().toLowerCase();
};

export const sanitizeObjectId = (value: string): string => {
  if (!Types.ObjectId.isValid(value)) {
    throw new Error('Invalid ObjectId format');
  }
  return value;
};

// Validation rules
export const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .customSanitizer(sanitizeEmail),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  
  body('role')
    .optional()
    .isIn(['admin', 'lawyer', 'customer'])
    .withMessage('Role must be admin, lawyer, or customer'),
  
  body('planId')
    .optional()
    .custom(sanitizeObjectId)
    .withMessage('Invalid plan ID format')
];

// Validation rules for user login (only email and password)
export const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .customSanitizer(sanitizeEmail),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

export const validateConsultation = [
  body('subject')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Subject must be between 5 and 200 characters')
    .customSanitizer(sanitizeString),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .customSanitizer(sanitizeString),
  
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  
  body('attachments.*')
    .optional()
    .isURL()
    .withMessage('Each attachment must be a valid URL')
];

export const validateProject = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .customSanitizer(sanitizeString),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .customSanitizer(sanitizeString),
  
  body('category')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),
  
  body('tags')
    .isArray({ min: 1, max: 10 })
    .withMessage('Tags must be an array with 1-10 items'),
  
  body('tags.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
    .customSanitizer(sanitizeString),
  
  body('fileUrl')
    .isURL()
    .withMessage('File URL must be a valid URL'),
  
  body('fileType')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('File type must be between 1 and 50 characters'),
  
  body('fileSize')
    .isInt({ min: 1, max: 100 * 1024 * 1024 }) // Max 100MB
    .withMessage('File size must be between 1 byte and 100MB'),
  
  body('isPublic')
    .isBoolean()
    .withMessage('isPublic must be a boolean value')
];

export const validateCourse = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .customSanitizer(sanitizeString),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .customSanitizer(sanitizeString),
  
  body('category')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),
  
  body('tags')
    .isArray({ min: 1, max: 10 })
    .withMessage('Tags must be an array with 1-10 items'),
  
  body('tags.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
    .customSanitizer(sanitizeString),
  
  body('videoUrl')
    .isURL()
    .withMessage('Video URL must be a valid URL'),
  
  body('thumbnailUrl')
    .optional()
    .isURL()
    .withMessage('Thumbnail URL must be a valid URL'),
  
  body('duration')
    .isInt({ min: 1, max: 1440 }) // Max 24 hours
    .withMessage('Duration must be between 1 and 1440 minutes'),
  
  body('level')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be beginner, intermediate, or advanced'),
  
  body('prerequisites')
    .isArray()
    .withMessage('Prerequisites must be an array'),
  
  body('prerequisites.*')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each prerequisite must be between 1 and 200 characters')
    .customSanitizer(sanitizeString),
  
  body('learningObjectives')
    .isArray({ min: 1, max: 20 })
    .withMessage('Learning objectives must be an array with 1-20 items'),
  
  body('learningObjectives.*')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each learning objective must be between 1 and 200 characters')
    .customSanitizer(sanitizeString)
];

export const validateDraft = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters')
    .customSanitizer(sanitizeString),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters')
    .customSanitizer(sanitizeString),
  
  body('type')
    .isIn(['legal_opinion', 'contract', 'motion', 'brief', 'other'])
    .withMessage('Type must be legal_opinion, contract, motion, brief, or other'),
  
  body('category')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),
  
  body('tags')
    .isArray({ min: 1, max: 10 })
    .withMessage('Tags must be an array with 1-10 items'),
  
  body('tags.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
    .customSanitizer(sanitizeString),
  
  body('fileUrl')
    .isURL()
    .withMessage('File URL must be a valid URL'),
  
  body('fileType')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('File type must be between 1 and 50 characters'),
  
  body('fileSize')
    .isInt({ min: 1, max: 100 * 1024 * 1024 }) // Max 100MB
    .withMessage('File size must be between 1 byte and 100MB'),
  
  body('consultationId')
    .optional()
    .custom(sanitizeObjectId)
    .withMessage('Invalid consultation ID format'),
  
  body('isPublic')
    .isBoolean()
    .withMessage('isPublic must be a boolean value')
];

export const validatePlan = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .customSanitizer(sanitizeString),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('features')
    .isArray({ min: 1, max: 20 })
    .withMessage('Features must be an array with 1-20 items'),
  
  body('features.*')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each feature must be between 1 and 200 characters')
    .customSanitizer(sanitizeString),
  
  body('isActive')
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Parameter validation
export const validateObjectId = [
  param('id')
    .custom(sanitizeObjectId)
    .withMessage('Invalid ID format')
];

// Query validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const validateSearch = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
    .customSanitizer(sanitizeString)
];

// Error handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? error.value : undefined
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
    return;
  }
  
  next();
};