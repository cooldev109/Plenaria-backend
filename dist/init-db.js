"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const models_1 = require("./models");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plenaria';
async function initDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(MONGODB_URI);
        console.log('Connected to MongoDB successfully');
        console.log('Clearing all data from database...');
        await models_1.User.deleteMany({});
        console.log('✓ Users collection cleared');
        await models_1.Plan.deleteMany({});
        console.log('✓ Plans collection cleared');
        await models_1.Consultation.deleteMany({});
        console.log('✓ Consultations collection cleared');
        await models_1.Project.deleteMany({});
        console.log('✓ Projects collection cleared');
        await models_1.Course.deleteMany({});
        console.log('✓ Courses collection cleared');
        console.log('\n=== DATABASE INITIALIZED ===');
        console.log('All tables are now empty and ready for fresh data.');
        console.log('Run "npm run seed" to populate with initial data.');
    }
    catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
if (require.main === module) {
    initDatabase();
}
exports.default = initDatabase;
//# sourceMappingURL=init-db.js.map