/**
 * Firebase Migration Script: Add user_type field to existing users
 *
 * This script migrates V1 users (permission field) to V2 schema (user_type + permission)
 * keeping backward compatibility with Flutter app.
 *
 * Run: node scripts/migrate-user-types.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json'); // You'll need to add this

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Migration mapping
const PERMISSION_TO_USER_TYPE = {
  'admin': 'admin',
  'beneficiary': 'consumer',
  'user': 'consumer',
  'business': 'business_team'
};

async function migrateUserTypes() {
  console.log('🚀 Starting user_type migration...\n');

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

  if (snapshot.empty) {
    console.log('❌ No users found in database');
    return;
  }

  console.log(`📊 Found ${snapshot.size} users to migrate\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const doc of snapshot.docs) {
    const userData = doc.data();
    const userId = doc.id;

    // Skip if user_type already exists
    if (userData.user_type) {
      console.log(`⏭️  Skipping ${userId} (already has user_type: ${userData.user_type})`);
      skipCount++;
      continue;
    }

    // Get V1 permission
    const permission = userData.permission;
    if (!permission) {
      console.log(`⚠️  User ${userId} has no permission field, skipping`);
      errorCount++;
      continue;
    }

    // Map to V2 user_type
    const userType = PERMISSION_TO_USER_TYPE[permission];
    if (!userType) {
      console.log(`❌ Unknown permission "${permission}" for user ${userId}`);
      errorCount++;
      continue;
    }

    try {
      const updates = {
        user_type: userType,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      // If business user, initialize empty business_roles array
      if (userType === 'business_team' && !userData.business_roles) {
        updates.business_roles = [];
      }

      await usersRef.doc(userId).update(updates);

      console.log(`✅ Migrated ${userId}: ${permission} → ${userType}`);
      successCount++;
    } catch (error) {
      console.log(`❌ Error migrating ${userId}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📈 Migration Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total: ${snapshot.size}\n`);

  process.exit(0);
}

// Dry run option
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
  migrateUserTypes().then(() => {
    console.log('✅ Dry run complete');
  });
} else {
  console.log('⚠️  WARNING: This will modify your production database!');
  console.log('Run with --dry-run flag to test first\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Continue? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
      migrateUserTypes();
    } else {
      console.log('Migration cancelled');
      process.exit(0);
    }
    readline.close();
  });
}
