const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../.env' });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plenaria';

async function checkUsers() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db();
    const users = await db.collection('users').find({}).toArray();

    console.log('👥 Users in database:', users.length);

    if (users.length === 0) {
      console.log('\n⚠️  No users found!');
      console.log('   Please register at: http://localhost:8084/auth/register\n');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Plan: ${user.plan}`);
        console.log(`   Status: ${user.status}`);
      });
      console.log('\n💡 You can login with any of these users at: http://localhost:8084/auth/login\n');
    }

    await client.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();
