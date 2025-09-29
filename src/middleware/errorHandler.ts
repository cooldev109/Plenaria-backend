import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';
import mongoose from 'mongoose';

interface CustomError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: any;
  errors?: any;
}

// Global error handler middleware
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      name: 'CastError',
      message,
      statusCode: 404
    } as CustomError;
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = {
      name: 'DuplicateKeyError',
      message,
      statusCode: 400
    } as CustomError;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = {
      name: 'ValidationError',
      message,
      statusCode: 400
    } as CustomError;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      name: 'JsonWebTokenError',
      message,
      statusCode: 401
    } as CustomError;
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      name: 'TokenExpiredError',
      message,
      statusCode: 401
    } as CustomError;
  }

  // Express validator errors
  if (err.name === 'ValidationError' && Array.isArray(err.errors)) {
    const message = err.errors.map((e: ValidationError) => e.msg).join(', ');
    error = {
      name: 'ValidationError',
      message,
      statusCode: 400
    } as CustomError;
  }

  // File upload errors
  if (err.name === 'MulterError') {
    let message = 'File upload error';
    if (err.message.includes('LIMIT_FILE_SIZE')) {
      message = 'File too large';
    } else if (err.message.includes('LIMIT_FILE_COUNT')) {
      message = 'Too many files';
    } else if (err.message.includes('LIMIT_UNEXPECTED_FILE')) {
      message = 'Unexpected file field';
    }
    error = {
      name: 'MulterError',
      message,
      statusCode: 400
    } as CustomError;
  }

  // Rate limiting errors
  if (err.name === 'TooManyRequestsError') {
    error = {
      name: 'TooManyRequestsError',
      message: 'Too many requests, please try again later',
      statusCode: 429
    } as CustomError;
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';

  // Don't leak error details in production
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

// 404 handler for undefined routes
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as CustomError;
  error.statusCode = 404;
  next(error);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};