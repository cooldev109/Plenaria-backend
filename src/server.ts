import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import lawyerRoutes from './routes/lawyer';
import customerRoutes from './routes/customer';
import chatRoutes from './routes/chat';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler';
import { connectDatabase, closeDatabase } from './utils/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plenaria';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FRONTEND_URLS = process.env.FRONTEND_URLS ? 
  process.env.FRONTEND_URLS.split(',') : 
  ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:3001'];

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // Much higher limit for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration - permissive for development
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:8081', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// HTTP request logging middleware
if (process.env.NODE_ENV === 'development') {
  // Development: detailed logging with colors
  app.use(morgan('dev'));
} else {
  // Production: concise logging
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lawyer', lawyerRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/chat', chatRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Database connection is now handled by utils/database.ts

// Start server
async function startServer() {
  try {
    await connectDatabase();
    
    app.listen(PORT, () => {
      console.log('🚀 Plenaria Backend Server Started');
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
      console.log('\n📋 Available endpoints:');
      console.log('  - POST /api/auth/register - User registration');
      console.log('  - POST /api/auth/login - User login');
      console.log('  - GET  /api/auth/me - Get current user');
      console.log('  - GET  /api/health - Health check');
      console.log('\n🔐 Initial users (after seeding):');
      console.log('  - Admin: walkerjames1127@gmail.com / futurephantom');
      console.log('  - Customer: mazenabass991@gmail.com / futurephantom');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await closeDatabase();
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

export default app;
