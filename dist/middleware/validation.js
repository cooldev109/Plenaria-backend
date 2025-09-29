"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleValidationErrors = exports.validateSearch = exports.validatePagination = exports.validateObjectId = exports.validatePlan = exports.validateDraft = exports.validateCourse = exports.validateProject = exports.validateConsultation = exports.validateUserLogin = exports.validateUser = exports.sanitizeObjectId = exports.sanitizeEmail = exports.sanitizeString = void 0;
const express_validator_1 = require("express-validator");
const mongoose_1 = require("mongoose");
const sanitizeString = (value) => {
    return value.trim().replace(/[<>]/g, '');
};
exports.sanitizeString = sanitizeString;
const sanitizeEmail = (value) => {
    return value.trim().toLowerCase();
};
exports.sanitizeEmail = sanitizeEmail;
const sanitizeObjectId = (value) => {
    if (!mongoose_1.Types.ObjectId.isValid(value)) {
        throw new Error('Invalid ObjectId format');
    }
    return value;
};
exports.sanitizeObjectId = sanitizeObjectId;
exports.validateUser = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .customSanitizer(exports.sanitizeEmail),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn(['admin', 'lawyer', 'customer'])
        .withMessage('Role must be admin, lawyer, or customer'),
    (0, express_validator_1.body)('planId')
        .optional()
        .custom(exports.sanitizeObjectId)
        .withMessage('Invalid plan ID format')
];
exports.validateUserLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .customSanitizer(exports.sanitizeEmail),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];
exports.validateConsultation = [
    (0, express_validator_1.body)('subject')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Subject must be between 5 and 200 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be between 10 and 2000 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('priority')
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be low, medium, high, or urgent'),
    (0, express_validator_1.body)('attachments')
        .optional()
        .isArray()
        .withMessage('Attachments must be an array'),
    (0, express_validator_1.body)('attachments.*')
        .optional()
        .isURL()
        .withMessage('Each attachment must be a valid URL')
];
exports.validateProject = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be between 10 and 2000 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('category')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category must be between 2 and 100 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('tags')
        .isArray({ min: 1, max: 10 })
        .withMessage('Tags must be an array with 1-10 items'),
    (0, express_validator_1.body)('tags.*')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Each tag must be between 1 and 50 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('fileUrl')
        .isURL()
        .withMessage('File URL must be a valid URL'),
    (0, express_validator_1.body)('fileType')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('File type must be between 1 and 50 characters'),
    (0, express_validator_1.body)('fileSize')
        .isInt({ min: 1, max: 100 * 1024 * 1024 })
        .withMessage('File size must be between 1 byte and 100MB'),
    (0, express_validator_1.body)('isPublic')
        .isBoolean()
        .withMessage('isPublic must be a boolean value')
];
exports.validateCourse = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be between 10 and 2000 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('category')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category must be between 2 and 100 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('tags')
        .isArray({ min: 1, max: 10 })
        .withMessage('Tags must be an array with 1-10 items'),
    (0, express_validator_1.body)('tags.*')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Each tag must be between 1 and 50 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('videoUrl')
        .isURL()
        .withMessage('Video URL must be a valid URL'),
    (0, express_validator_1.body)('thumbnailUrl')
        .optional()
        .isURL()
        .withMessage('Thumbnail URL must be a valid URL'),
    (0, express_validator_1.body)('duration')
        .isInt({ min: 1, max: 1440 })
        .withMessage('Duration must be between 1 and 1440 minutes'),
    (0, express_validator_1.body)('level')
        .isIn(['beginner', 'intermediate', 'advanced'])
        .withMessage('Level must be beginner, intermediate, or advanced'),
    (0, express_validator_1.body)('prerequisites')
        .isArray()
        .withMessage('Prerequisites must be an array'),
    (0, express_validator_1.body)('prerequisites.*')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Each prerequisite must be between 1 and 200 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('learningObjectives')
        .isArray({ min: 1, max: 20 })
        .withMessage('Learning objectives must be an array with 1-20 items'),
    (0, express_validator_1.body)('learningObjectives.*')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Each learning objective must be between 1 and 200 characters')
        .customSanitizer(exports.sanitizeString)
];
exports.validateDraft = [
    (0, express_validator_1.body)('title')
        .trim()
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('description')
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage('Description must be between 10 and 2000 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('type')
        .isIn(['legal_opinion', 'contract', 'motion', 'brief', 'other'])
        .withMessage('Type must be legal_opinion, contract, motion, brief, or other'),
    (0, express_validator_1.body)('category')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Category must be between 2 and 100 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('tags')
        .isArray({ min: 1, max: 10 })
        .withMessage('Tags must be an array with 1-10 items'),
    (0, express_validator_1.body)('tags.*')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Each tag must be between 1 and 50 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('fileUrl')
        .isURL()
        .withMessage('File URL must be a valid URL'),
    (0, express_validator_1.body)('fileType')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('File type must be between 1 and 50 characters'),
    (0, express_validator_1.body)('fileSize')
        .isInt({ min: 1, max: 100 * 1024 * 1024 })
        .withMessage('File size must be between 1 byte and 100MB'),
    (0, express_validator_1.body)('consultationId')
        .optional()
        .custom(exports.sanitizeObjectId)
        .withMessage('Invalid consultation ID format'),
    (0, express_validator_1.body)('isPublic')
        .isBoolean()
        .withMessage('isPublic must be a boolean value')
];
exports.validatePlan = [
    (0, express_validator_1.body)('name')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('features')
        .isArray({ min: 1, max: 20 })
        .withMessage('Features must be an array with 1-20 items'),
    (0, express_validator_1.body)('features.*')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Each feature must be between 1 and 200 characters')
        .customSanitizer(exports.sanitizeString),
    (0, express_validator_1.body)('isActive')
        .isBoolean()
        .withMessage('isActive must be a boolean value')
];
exports.validateObjectId = [
    (0, express_validator_1.param)('id')
        .custom(exports.sanitizeObjectId)
        .withMessage('Invalid ID format')
];
exports.validatePagination = [
    (0, express_validator_1.query)('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    (0, express_validator_1.query)('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100')
];
exports.validateSearch = [
    (0, express_validator_1.query)('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters')
        .customSanitizer(exports.sanitizeString)
];
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
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
exports.handleValidationErrors = handleValidationErrors;
//# sourceMappingURL=validation.js.map