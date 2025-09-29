"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.allRoles = exports.adminOrCustomer = exports.adminOrLawyer = exports.customerOnly = exports.lawyerOnly = exports.adminOnly = exports.roleMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET || 'plenaria-dev-secret-key-2024';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await models_1.User.findById(decoded.userId).select('-password');
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid token. User not found.'
            });
            return;
        }
        if (!user.isActive) {
            res.status(401).json({
                success: false,
                message: 'Account is deactivated.'
            });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
            return;
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
            return;
        }
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.'
        });
    }
};
exports.authMiddleware = authMiddleware;
const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
            return;
        }
        next();
    };
};
exports.roleMiddleware = roleMiddleware;
exports.adminOnly = (0, exports.roleMiddleware)(['admin']);
exports.lawyerOnly = (0, exports.roleMiddleware)(['lawyer']);
exports.customerOnly = (0, exports.roleMiddleware)(['customer']);
exports.adminOrLawyer = (0, exports.roleMiddleware)(['admin', 'lawyer']);
exports.adminOrCustomer = (0, exports.roleMiddleware)(['admin', 'customer']);
exports.allRoles = (0, exports.roleMiddleware)(['admin', 'lawyer', 'customer']);
//# sourceMappingURL=auth.js.map