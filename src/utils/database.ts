import mongoose from 'mongoose';

// Database connection and optimization utilities
export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plenaria';
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
    
    // Create indexes for better performance
    await createIndexes();
    
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create database indexes for optimization
export const createIndexes = async (): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    
    // User collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ planId: 1 });
    await db.collection('users').createIndex({ isActive: 1 });
    await db.collection('users').createIndex({ createdAt: -1 });
    
    // Plan collection indexes
    await db.collection('plans').createIndex({ name: 1 }, { unique: true });
    await db.collection('plans').createIndex({ isActive: 1 });
    await db.collection('plans').createIndex({ price: 1 });
    
    // Consultation collection indexes
    await db.collection('consultations').createIndex({ customerId: 1 });
    await db.collection('consultations').createIndex({ lawyerId: 1 });
    await db.collection('consultations').createIndex({ status: 1 });
    await db.collection('consultations').createIndex({ priority: 1 });
    await db.collection('consultations').createIndex({ createdAt: -1 });
    await db.collection('consultations').createIndex({ requestedAt: -1 });
    await db.collection('consultations').createIndex({ 
      customerId: 1, 
      createdAt: 1 
    });
    
    // Project collection indexes
    await db.collection('projects').createIndex({ title: 'text', description: 'text' });
    await db.collection('projects').createIndex({ category: 1 });
    await db.collection('projects').createIndex({ createdBy: 1 });
    await db.collection('projects').createIndex({ isPublic: 1 });
    await db.collection('projects').createIndex({ createdAt: -1 });
    await db.collection('projects').createIndex({ tags: 1 });
    
    // Course collection indexes
    await db.collection('courses').createIndex({ title: 'text', description: 'text' });
    await db.collection('courses').createIndex({ category: 1 });
    await db.collection('courses').createIndex({ level: 1 });
    await db.collection('courses').createIndex({ createdBy: 1 });
    await db.collection('courses').createIndex({ isPublic: 1 });
    await db.collection('courses').createIndex({ createdAt: -1 });
    await db.collection('courses').createIndex({ tags: 1 });
    
    // Draft collection indexes
    await db.collection('drafts').createIndex({ title: 'text', description: 'text' });
    await db.collection('drafts').createIndex({ type: 1 });
    await db.collection('drafts').createIndex({ category: 1 });
    await db.collection('drafts').createIndex({ lawyerId: 1 });
    await db.collection('drafts').createIndex({ consultationId: 1 });
    await db.collection('drafts').createIndex({ isPublic: 1 });
    await db.collection('drafts').createIndex({ createdAt: -1 });
    await db.collection('drafts').createIndex({ tags: 1 });
    
    console.log('Database indexes created successfully');
    
  } catch (error) {
    console.error('Error creating database indexes:', error);
  }
};

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const state = mongoose.connection.readyState;
    return state === 1; // Connected
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

