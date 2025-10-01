"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const admin_1 = __importDefault(require("./routes/admin"));
const lawyer_1 = __importDefault(require("./routes/lawyer"));
const customer_1 = __importDefault(require("./routes/customer"));
const chat_1 = __importDefault(require("./routes/chat"));
const errorHandler_1 = require("./middleware/errorHandler");
const database_1 = require("./utils/database");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plenaria';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const FRONTEND_URLS = process.env.FRONTEND_URLS ?
    process.env.FRONTEND_URLS.split(',') :
    ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:3001'];
app.use((0, helmet_1.default)());
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 10000 : 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use(limiter);
app.use((0, cors_1.default)({
    origin: ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:8081', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});
app.use('/api/auth', auth_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/lawyer', lawyer_1.default);
app.use('/api/customer', customer_1.default);
app.use('/api/chat', chat_1.default);
app.use(errorHandler_1.notFound);
app.use(errorHandler_1.errorHandler);
async function startServer() {
    try {
        await (0, database_1.connectDatabase)();
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
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down server...');
    await (0, database_1.closeDatabase)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down server...');
    await (0, database_1.closeDatabase)();
    process.exit(0);
});
if (require.main === module) {
    startServer();
}
exports.default = app;
//# sourceMappingURL=server.js.map