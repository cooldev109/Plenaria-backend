"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDatabase = exports.checkDatabaseHealth = exports.createIndexes = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plenaria';
        await mongoose_1.default.connect(mongoUri);
        console.log('MongoDB connected successfully');
        await (0, exports.createIndexes)();
    }
    catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
const createIndexes = async () => {
    try {
        const db = mongoose_1.default.connection.db;
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('users').createIndex({ role: 1 });
        await db.collection('users').createIndex({ planId: 1 });
        await db.collection('users').createIndex({ isActive: 1 });
        await db.collection('users').createIndex({ createdAt: -1 });
        await db.collection('plans').createIndex({ name: 1 }, { unique: true });
        await db.collection('plans').createIndex({ isActive: 1 });
        await db.collection('plans').createIndex({ price: 1 });
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
        await db.collection('projects').createIndex({ title: 'text', description: 'text' });
        await db.collection('projects').createIndex({ category: 1 });
        await db.collection('projects').createIndex({ createdBy: 1 });
        await db.collection('projects').createIndex({ isPublic: 1 });
        await db.collection('projects').createIndex({ createdAt: -1 });
        await db.collection('projects').createIndex({ tags: 1 });
        await db.collection('courses').createIndex({ title: 'text', description: 'text' });
        await db.collection('courses').createIndex({ category: 1 });
        await db.collection('courses').createIndex({ level: 1 });
        await db.collection('courses').createIndex({ createdBy: 1 });
        await db.collection('courses').createIndex({ isPublic: 1 });
        await db.collection('courses').createIndex({ createdAt: -1 });
        await db.collection('courses').createIndex({ tags: 1 });
        await db.collection('drafts').createIndex({ title: 'text', description: 'text' });
        await db.collection('drafts').createIndex({ type: 1 });
        await db.collection('drafts').createIndex({ category: 1 });
        await db.collection('drafts').createIndex({ lawyerId: 1 });
        await db.collection('drafts').createIndex({ consultationId: 1 });
        await db.collection('drafts').createIndex({ isPublic: 1 });
        await db.collection('drafts').createIndex({ createdAt: -1 });
        await db.collection('drafts').createIndex({ tags: 1 });
        console.log('Database indexes created successfully');
    }
    catch (error) {
        console.error('Error creating database indexes:', error);
    }
};
exports.createIndexes = createIndexes;
const checkDatabaseHealth = async () => {
    try {
        const state = mongoose_1.default.connection.readyState;
        return state === 1;
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return false;
    }
};
exports.checkDatabaseHealth = checkDatabaseHealth;
const closeDatabase = async () => {
    try {
        await mongoose_1.default.connection.close();
        console.log('MongoDB connection closed');
    }
    catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
};
exports.closeDatabase = closeDatabase;
//# sourceMappingURL=database.js.map