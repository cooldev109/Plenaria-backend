import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, Plan, Consultation, Project, Course } from './models';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/plenaria';

async function initDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Clear all data from all collections
    console.log('Clearing all data from database...');
    
    await User.deleteMany({});
    console.log('✓ Users collection cleared');
    
    await Plan.deleteMany({});
    console.log('✓ Plans collection cleared');
    
    await Consultation.deleteMany({});
    console.log('✓ Consultations collection cleared');
    
    await Project.deleteMany({});
    console.log('✓ Projects collection cleared');
    
    await Course.deleteMany({});
    console.log('✓ Courses collection cleared');

    console.log('\n=== DATABASE INITIALIZED ===');
    console.log('All tables are now empty and ready for fresh data.');
    console.log('Run "npm run seed" to populate with initial data.');

  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the init function
if (require.main === module) {
  initDatabase();
}

export default initDatabase;

