/**
 * Firebase Script: Update is_founder property on all businesses
 *
 * This script updates the is_founder field on all business documents
 * and syncs it to the subscription.is_founder field if a subscription exists.
 *
 * Run: node scripts/update-is-founder.js
 * Dry run: node scripts/update-is-founder.js --dry-run
 * Set to false: node scripts/update-is-founder.js --value=false
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ============================================================================
// CONFIGURATION
// ============================================================================

// Default value for is_founder (can be overridden with --value=true/false)
const DEFAULT_IS_FOUNDER_VALUE = true;

// ============================================================================
// Main Update Function
// ============================================================================

async function updateIsFounder() {
  console.log('Starting is_founder update...\n');
  console.log(`Setting is_founder to: ${isFounderValue}\n`);

  const businessesRef = db.collection('businesses');
  const snapshot = await businessesRef.get();

  if (snapshot.empty) {
    console.log('No businesses found in database');
    return;
  }

  console.log(`Found ${snapshot.size} businesses to update\n`);

  let updatedCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const updatedBusinesses = [];

  for (const doc of snapshot.docs) {
    const businessData = doc.data();
    const businessId = doc.id;

    // Check if already has the target value
    if (businessData.is_founder === isFounderValue) {
      console.log(`Skipping ${businessData.name || businessId} (already is_founder=${isFounderValue})`);
      skipCount++;
      continue;
    }

    if (isDryRun) {
      console.log(`Would update: ${businessData.name || businessId}`);
      console.log(`   Email: ${businessData.email}`);
      console.log(`   Current is_founder: ${businessData.is_founder}`);
      console.log(`   New is_founder: ${isFounderValue}`);
      console.log('');
      updatedCount++;
      continue;
    }

    try {
      // Build the update object
      const updateData = {
        is_founder: isFounderValue,
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      };

      // If subscription exists, also update is_founder inside it
      if (businessData.subscription) {
        updateData['subscription.is_founder'] = isFounderValue;
        updateData['subscription.updated_at'] = admin.firestore.Timestamp.now();
      }

      // Update the business document
      await businessesRef.doc(businessId).update(updateData);

      console.log(`Updated: ${businessData.name || businessId} -> is_founder=${isFounderValue}`);
      updatedCount++;

      updatedBusinesses.push({
        id: businessId,
        name: businessData.name,
        email: businessData.email,
        is_founder: isFounderValue
      });

    } catch (error) {
      console.log(`Error updating ${businessData.name || businessId}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('Update Summary:');
  console.log('='.repeat(60));
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Skipped: ${skipCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total: ${snapshot.size}`);
  console.log('='.repeat(60) + '\n');

  if (!isDryRun && updatedBusinesses.length > 0) {
    console.log('\nUpdated businesses:');
    console.log(JSON.stringify(updatedBusinesses, null, 2));
  }

  process.exit(0);
}

// ============================================================================
// Command Line Interface
// ============================================================================

const isDryRun = process.argv.includes('--dry-run');

// Parse --value flag
let isFounderValue = DEFAULT_IS_FOUNDER_VALUE;
const valueArg = process.argv.find(arg => arg.startsWith('--value='));
if (valueArg) {
  const value = valueArg.split('=')[1].toLowerCase();
  isFounderValue = value === 'true';
}

if (isDryRun) {
  console.log('DRY RUN MODE - No changes will be made\n');
  updateIsFounder().catch((error) => {
    console.error('Update failed:', error);
    process.exit(1);
  });
} else {
  console.log('WARNING: This will modify your production database!\n');
  console.log('This script will:');
  console.log(`  1. Set is_founder=${isFounderValue} on all business documents`);
  console.log('  2. Also update subscription.is_founder if subscription exists\n');
  console.log('Run with --dry-run flag to preview changes first\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Type "yes" to continue: ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
      readline.close();
      updateIsFounder().catch((error) => {
        console.error('Update failed:', error);
        process.exit(1);
      });
    } else {
      console.log('Update cancelled');
      readline.close();
      process.exit(0);
    }
  });
}
