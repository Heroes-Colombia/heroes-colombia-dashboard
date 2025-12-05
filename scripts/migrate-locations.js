/**
 * Firebase Migration Script: Create locations subcollection from existing business data
 *
 * This script migrates businesses from single location (in parent doc) to
 * locations subcollection structure for multi-location support.
 *
 * Run: node scripts/migrate-locations.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateLocations() {
  console.log('🚀 Starting locations subcollection migration...\n');

  const businessesRef = db.collection('businesses');
  const snapshot = await businessesRef.get();

  if (snapshot.empty) {
    console.log('❌ No businesses found in database');
    return;
  }

  console.log(`📊 Found ${snapshot.size} businesses to process\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const doc of snapshot.docs) {
    const businessData = doc.data();
    const businessId = doc.id;

    try {
      // Check if locations subcollection already exists
      const locationsSnapshot = await businessesRef
        .doc(businessId)
        .collection('locations')
        .limit(1)
        .get();

      if (!locationsSnapshot.empty) {
        console.log(`⏭️  Skipping ${businessId} (${businessData.name}) - locations already exist`);
        skipCount++;
        continue;
      }

      // Check if business has location data
      const hasPhysicalLocation = businessData.location && businessData.address;
      const hasAnyLocationData = hasPhysicalLocation || businessData.phone_number || businessData.email;

      if (!hasAnyLocationData) {
        console.log(`⚠️  Skipping ${businessId} (${businessData.name}) - no location data to migrate`);
        skipCount++;
        continue;
      }

      // Determine location type
      const locationType = hasPhysicalLocation ? 'physical' : 'online';

      // Create primary location data
      const locationData = {
        name: `${businessData.name} - Sede Principal`,
        is_primary: true,
        type: locationType,

        // Contact info (all locations have these)
        phone: businessData.phone_number || null,
        email: businessData.email || null,
        website: businessData.website || null,

        // Physical location fields
        address: businessData.address || null,
        location: businessData.location || null,
        geo_hash: businessData.geo_hash || null,
        business_hours: null, // Can be added manually later

        // Online location fields
        delivery_zones: null,
        delivery_type: null,
        whatsapp: null,

        // Status
        status: 'active',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      // Create location in subcollection
      await businessesRef
        .doc(businessId)
        .collection('locations')
        .add(locationData);

      console.log(`✅ Migrated ${businessId} (${businessData.name}) - ${locationType} location created`);
      successCount++;

    } catch (error) {
      console.log(`❌ Error migrating ${businessId} (${businessData.name}):`, error.message);
      errorCount++;
    }
  }

  console.log('\n📈 Migration Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total: ${snapshot.size}\n`);

  console.log('⚠️  Important Notes:');
  console.log('   - Parent business location/address fields were NOT deleted (Flutter app needs them)');
  console.log('   - Primary location data is duplicated in subcollection');
  console.log('   - When primary location changes in dashboard, it syncs back to parent doc');
  console.log('   - Businesses can now add more locations via dashboard (up to plan limits)\n');

  process.exit(0);
}

// Dry run option
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');

  // In dry run, just count and report
  (async () => {
    const snapshot = await db.collection('businesses').get();
    console.log(`Would process ${snapshot.size} businesses\n`);

    let wouldMigrate = 0;
    let wouldSkip = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const locationsSnapshot = await db
        .collection('businesses')
        .doc(doc.id)
        .collection('locations')
        .limit(1)
        .get();

      if (locationsSnapshot.empty && (data.location || data.address || data.phone_number)) {
        wouldMigrate++;
      } else {
        wouldSkip++;
      }
    }

    console.log(`Would migrate: ${wouldMigrate}`);
    console.log(`Would skip: ${wouldSkip}\n`);
    console.log('✅ Dry run complete - run without --dry-run to apply changes');
    process.exit(0);
  })();
} else {
  console.log('⚠️  WARNING: This will modify your production database!');
  console.log('Run with --dry-run flag to test first\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Continue? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
      migrateLocations();
    } else {
      console.log('Migration cancelled');
      process.exit(0);
    }
    readline.close();
  });
}
