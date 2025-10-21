const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plenaria';

async function checkDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();

    const coursesCount = await db.collection('courses').countDocuments();
    const templatesCount = await db.collection('projecttemplates').countDocuments();

    console.log(`📊 Database Statistics:`);
    console.log(`   - Courses: ${coursesCount}`);
    console.log(`   - Project Templates: ${templatesCount}\n`);

    if (coursesCount > 0) {
      console.log('📝 Sample Course:');
      const sampleCourse = await db.collection('courses').findOne();
      console.log(`   Title: ${sampleCourse.title}`);
      console.log(`   Visibility: ${sampleCourse.visibility}`);
      console.log(`   Materials: ${sampleCourse.materials?.length || 0}`);
      console.log(`   Tags: ${sampleCourse.tags?.length || 0}\n`);
    }

    if (templatesCount > 0) {
      console.log('📄 Sample Template:');
      const sampleTemplate = await db.collection('projecttemplates').findOne();
      console.log(`   Title: ${sampleTemplate.title}`);
      console.log(`   Visibility: ${sampleTemplate.visibility}`);
      console.log(`   Supplementary Materials: ${sampleTemplate.supplementaryMaterials?.length || 0}`);
      console.log(`   Tags: ${sampleTemplate.tags?.length || 0}`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

checkDatabase();
