"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFound = exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    console.error('Error:', err);
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = {
            name: 'CastError',
            message,
            statusCode: 404
        };
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        error = {
            name: 'DuplicateKeyError',
            message,
            statusCode: 400
        };
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = {
            name: 'ValidationError',
            message,
            statusCode: 400
        };
    }
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = {
            name: 'JsonWebTokenError',
            message,
            statusCode: 401
        };
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = {
            name: 'TokenExpiredError',
            message,
            statusCode: 401
        };
    }
    if (err.name === 'ValidationError' && Array.isArray(err.errors)) {
        const message = err.errors.map((e) => e.msg).join(', ');
        error = {
            name: 'ValidationError',
            message,
            statusCode: 400
        };
    }
    if (err.name === 'MulterError') {
        let message = 'File upload error';
        if (err.message.includes('LIMIT_FILE_SIZE')) {
            message = 'File too large';
        }
        else if (err.message.includes('LIMIT_FILE_COUNT')) {
            message = 'Too many files';
        }
        else if (err.message.includes('LIMIT_UNEXPECTED_FILE')) {
            message = 'Unexpected file field';
        }
        error = {
            name: 'MulterError',
            message,
            statusCode: 400
        };
    }
    if (err.name === 'TooManyRequestsError') {
        error = {
            name: 'TooManyRequestsError',
            message: 'Too many requests, please try again later',
            statusCode: 429
        };
    }
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Server Error';
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(statusCode).json({
        success: false,
        message,
        ...(isDevelopment && {
            stack: err.stack,
            error: err
        })
    });
};
exports.errorHandler = errorHandler;
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};
exports.notFound = notFound;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map