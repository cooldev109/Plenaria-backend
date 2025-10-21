import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './utils/db';
import { setupConsultationsSocket } from './sockets/consultationsSocket';

// Load environment variables
dotenv.config();

// Server configuration
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Setup Socket.IO
    const allowedOrigins = [
      FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:8082',
      'http://localhost:3000',
    ];

    const io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        credentials: true,
      },
    });

    // Setup consultations namespace
    setupConsultationsSocket(io);

    // Start listening
    httpServer.listen(PORT, () => {
      console.warn(`
┌─────────────────────────────────────────┐
│  Plenaria Backend Server                │
├─────────────────────────────────────────┤
│  Environment: ${NODE_ENV.padEnd(24)} │
│  Port: ${String(PORT).padEnd(32)} │
│  Status: Running                        │
│  Socket.IO: Enabled                     │
└─────────────────────────────────────────┘
      `);
      console.warn(`Server is running on http://localhost:${PORT}`);
      console.warn(`Health check: http://localhost:${PORT}/health`);
      console.warn(`Socket.IO: ws://localhost:${PORT}/consultations`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();
