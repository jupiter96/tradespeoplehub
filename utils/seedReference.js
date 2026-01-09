import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Generate unique 6-digit reference ID
const generateReferenceId = async () => {
  let referenceId;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 6-digit number (100000 to 999999)
    referenceId = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Check if it's unique
    const existingUser = await User.findOne({ referenceId });
    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique reference ID after multiple attempts');
  }

  return referenceId;
};

async function seedReferenceIds() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users without referenceId
    const usersWithoutReference = await User.find({
      $or: [
        { referenceId: { $exists: false } },
        { referenceId: null },
        { referenceId: '' },
      ],
      isDeleted: { $ne: true }, // Exclude deleted users
    });

    console.log(`📊 Found ${usersWithoutReference.length} users without reference ID`);

    if (usersWithoutReference.length === 0) {
      console.log('✅ All users already have reference IDs');
      await mongoose.disconnect();
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    // Assign reference IDs to each user
    for (const user of usersWithoutReference) {
      try {
        const referenceId = await generateReferenceId();
        user.referenceId = referenceId;
        await user.save();
        successCount++;
        console.log(`✅ Assigned reference ID ${referenceId} to user ${user.email}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to assign reference ID to user ${user.email}:`, error.message);
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   ✅ Successfully assigned: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📊 Total processed: ${usersWithoutReference.length}`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error seeding reference IDs:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the seed function
seedReferenceIds();
