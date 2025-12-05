/**
 * Firebase Migration Script: Migrate advertisements to promotions collection
 *
 * This script migrates data from V1 'advertisements' collection to V2 'promotions' collection
 * with updated field names and new features.
 *
 * Run: node scripts/migrate-promotions.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migratePromotions() {
  console.log('🚀 Starting advertisements → promotions migration...\n');

  const advertisementsRef = db.collection('advertisements');
  const promotionsRef = db.collection('promotions');
  const snapshot = await advertisementsRef.get();

  if (snapshot.empty) {
    console.log('❌ No advertisements found in database');
    return;
  }

  console.log(`📊 Found ${snapshot.size} advertisements to migrate\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const doc of snapshot.docs) {
    const adData = doc.data();
    const adId = doc.id;

    try {
      // Check if promotion already exists with same ID
      const existingPromotion = await promotionsRef.doc(adId).get();
      if (existingPromotion.exists) {
        console.log(`⏭️  Skipping ${adId} (${adData.title}) - already exists in promotions`);
        skipCount++;
        continue;
      }

      // Map V1 advertisement fields to V2 promotion fields
      const promotionData = {
        // Identity (keep same)
        business_id: adData.business_id,
        title: adData.title || 'Sin título',
        description: adData.description || '',
        instructions: adData.instructions || 'Presenta tu carnet militar al momento de la compra',
        featured_image: adData.featured_image || '',

        // Discount (keep same)
        percentage: adData.percentage || 0,
        type: 'percentage', // Default type, can be enhanced later

        // Location targeting (NEW in V2)
        location_ids: adData.location_ids || [], // Empty = all locations

        // Timing
        start_date: adData.start_date || null,
        expired_at: adData.expired_at || admin.firestore.Timestamp.fromDate(new Date('2099-12-31')),

        // Limits (new fields, optional)
        max_redemptions: adData.max_redemptions || null,
        max_per_user: adData.max_per_user || null,
        current_redemptions: adData.current_redemptions || 0,

        // Status & Features
        status: adData.status || 'active',
        is_featured: adData.is_featured || false,
        featured_priority: adData.featured_priority || null,

        // Metadata
        created_at: adData.created_at || admin.firestore.FieldValue.serverTimestamp(),
        updated_at: adData.updated_at || admin.firestore.FieldValue.serverTimestamp(),
        created_by: adData.created_by || 'migration',

        // Analytics (NEW in V2)
        views_count: adData.views_count || 0,
        saves_count: adData.saves_count || 0,
        redemptions_count: adData.redemptions_count || adData.current_redemptions || 0
      };

      // Create promotion document with same ID as advertisement
      await promotionsRef.doc(adId).set(promotionData);

      console.log(`✅ Migrated ${adId} (${adData.title}) - ${adData.status}`);
      successCount++;

    } catch (error) {
      console.log(`❌ Error migrating ${adId} (${adData.title}):`, error.message);
      errorCount++;
    }
  }

  console.log('\n📈 Migration Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total: ${snapshot.size}\n`);

  console.log('⚠️  Important Notes:');
  console.log('   - Original "advertisements" collection was NOT deleted (for rollback safety)');
  console.log('   - Promotion IDs match original advertisement IDs');
  console.log('   - New fields added: location_ids, views_count, saves_count');
  console.log('   - Flutter app must be updated to read from "promotions" collection');
  console.log('   - Dashboard already uses "promotions" collection via V2 functions\n');
  console.log('⚠️  Next Steps:');
  console.log('   1. Test Flutter app with new promotions collection');
  console.log('   2. Once verified, you can delete "advertisements" collection manually');
  console.log('   3. Update Firebase security rules to remove "advertisements" permissions\n');

  process.exit(0);
}

// Dry run option
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');

  // In dry run, just count and report
  (async () => {
    const adsSnapshot = await db.collection('advertisements').get();
    const promosSnapshot = await db.collection('promotions').get();

    console.log(`Found ${adsSnapshot.size} advertisements in source collection`);
    console.log(`Found ${promosSnapshot.size} promotions already in target collection\n`);

    let wouldMigrate = 0;
    let wouldSkip = 0;

    for (const doc of adsSnapshot.docs) {
      const existingPromo = await db.collection('promotions').doc(doc.id).get();
      if (existingPromo.exists) {
        wouldSkip++;
      } else {
        wouldMigrate++;
      }
    }

    console.log(`Would migrate: ${wouldMigrate}`);
    console.log(`Would skip (already exist): ${wouldSkip}\n`);

    // Show sample of what would be migrated
    if (adsSnapshot.size > 0) {
      const sampleDoc = adsSnapshot.docs[0];
      const sampleData = sampleDoc.data();
      console.log('📋 Sample advertisement to migrate:');
      console.log(`   ID: ${sampleDoc.id}`);
      console.log(`   Title: ${sampleData.title}`);
      console.log(`   Business: ${sampleData.business_id}`);
      console.log(`   Status: ${sampleData.status}`);
      console.log(`   Percentage: ${sampleData.percentage}%\n`);
    }

    console.log('✅ Dry run complete - run without --dry-run to apply changes');
    process.exit(0);
  })();
} else {
  console.log('⚠️  WARNING: This will create documents in the "promotions" collection!');
  console.log('Run with --dry-run flag to test first\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Continue? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
      migratePromotions();
    } else {
      console.log('Migration cancelled');
      process.exit(0);
    }
    readline.close();
  });
}
