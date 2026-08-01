/**
 * Admin Setup Script — helps find, list, and promote users to Admin.
 *
 * Usage:
 *   node src/scripts/admin_setup.js                  # Lists all users and current admins
 *   node src/scripts/admin_setup.js <user-email>     # Promotes the user with this email to admin
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

// Load environment variables from the root folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mockly';

async function run() {
  console.log(`\n🌱 Connecting to MongoDB at ${uri}…`);
  await mongoose.connect(uri);

  const email = (process.argv[2] || 'admin@mockly.com').toLowerCase().trim();
  console.log(`🔍 Looking for user with email: ${email}…`);

  const user = await User.findOne({ email });

  if (user) {
    user.role = 'admin';
    await user.save();
    console.log(`\n🎉 Success! User "${user.name}" (${user.email}) has been promoted to admin.`);
    console.log('   You can now log in using these credentials to access the admin panel at /admin.');
  } else {
    if (process.argv[2]) {
      console.log(`❌ User with email "${email}" not found.`);
      console.log('💡 Tip: Register this user on the website first, then run this script to promote them.');
    } else {
      console.log(`ℹ️  Default user "admin@mockly.com" not found in database.`);
      console.log('👥 Fetching other user accounts…');
      
      const users = await User.find({});
      if (users.length === 0) {
        console.log('\n❌ No user accounts found in the database.');
        console.log('💡 How to log in as admin:');
        console.log('  1. Register a standard account with email "admin@mockly.com" at /register.');
        console.log('  2. Run this script to promote it:');
        console.log('     node src/scripts/admin_setup.js');
      } else {
        console.log(`\nFound ${users.length} user(s):`);
        console.log('--------------------------------------------------');
        users.forEach(u => {
          const isCurrentAdmin = u.role === 'admin';
          console.log(`- ${u.name} [${u.email}] - Role: ${u.role.toUpperCase()} ${isCurrentAdmin ? '👑' : ''}`);
        });
        console.log('--------------------------------------------------');
        console.log('\n💡 To promote any of these users to admin, run:');
        console.log('   node src/scripts/admin_setup.js <email>');
      }
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Error running admin setup:', err);
  process.exit(1);
});
