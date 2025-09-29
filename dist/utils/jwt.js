"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRefreshToken = exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const generateToken = (user) => {
    const payload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
    };
    const jwtSecret = process.env.JWT_SECRET || 'plenaria-dev-secret-key-2024';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    return jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    const jwtSecret = process.env.JWT_SECRET || 'plenaria-dev-secret-key-2024';
    return jsonwebtoken_1.default.verify(token, jwtSecret);
};
exports.verifyToken = verifyToken;
const generateRefreshToken = (user) => {
    const payload = {
        userId: user._id.toString(),
        type: 'refresh'
    };
    const jwtSecret = process.env.JWT_SECRET || 'plenaria-dev-secret-key-2024';
    const refreshExpiresIn = '30d';
    return jsonwebtoken_1.default.sign(payload, jwtSecret, { expiresIn: refreshExpiresIn });
};
exports.generateRefreshToken = generateRefreshToken;
//# sourceMappingURL=jwt.js.map