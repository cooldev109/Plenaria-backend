"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCustomerOrLawyer = exports.requireRole = exports.socketAuthMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const socketAuthMiddleware = async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) {
            return next(new Error('Authentication token required'));
        }
        const jwtSecret = process.env.JWT_SECRET || 'plenaria-dev-secret-key-2024';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await models_1.User.findById(decoded.userId).select('-password');
        if (!user) {
            return next(new Error('User not found'));
        }
        if (!user.isActive) {
            return next(new Error('Account is deactivated'));
        }
        socket.user = user;
        socket.userId = user._id.toString();
        socket.userRole = user.role;
        console.log(`🔐 Socket authenticated: ${user.name} (${user.role})`);
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return next(new Error('Invalid token'));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return next(new Error('Token expired'));
        }
        console.error('Socket auth middleware error:', error);
        next(new Error('Authentication failed'));
    }
};
exports.socketAuthMiddleware = socketAuthMiddleware;
const requireRole = (allowedRoles) => {
    return (socket, next) => {
        if (!socket.userRole || !allowedRoles.includes(socket.userRole)) {
            return next(new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`));
        }
        next();
    };
};
exports.requireRole = requireRole;
const requireCustomerOrLawyer = (socket, next) => {
    if (!socket.userRole || !['customer', 'lawyer'].includes(socket.userRole)) {
        return next(new Error('Access denied. Only customers and lawyers can access chat'));
    }
    next();
};
exports.requireCustomerOrLawyer = requireCustomerOrLawyer;
//# sourceMappingURL=authMiddleware.js.map