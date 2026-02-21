/**
 * Firebase Migration Script: Add subscription object to existing businesses
 *
 * This script migrates existing businesses (currently 37 trial clients) to the new
 * V2 subscription schema with embedded subscription object.
 *
 * Default behavior:
 * - Creates subscription object with status: "trial"
 * - Sets end_date to March 31, 2026 (configurable below)
 * - Preserves existing plan field as is
 * - Sets trial clients to Enterprise features during trial
 *
 * Run: node scripts/migrate-trial-subscriptions.js
 * Dry run: node scripts/migrate-trial-subscriptions.js --dry-run
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ============================================================================
// CONFIGURATION - Adjust these values before running
// ============================================================================

// Minimum trial end date - if calculated date is before this, use this instead
const MINIMUM_TRIAL_END_DATE = new Date('2026-03-31T23:59:59.000Z');

// Trial duration in months (from creation date)
const TRIAL_DURATION_MONTHS = 2;

// Special cases - businesses that need different end dates
// Format: { email: endDate } or { businessId: endDate }
const SPECIAL_CASES = {
  // Example:
  // 'special@business.com': new Date('2026-04-30T23:59:59.000Z'),
  // 'anotherBusinessId123': new Date('2026-05-15T23:59:59.000Z'),
};

// ============================================================================
// Migration Logic
// ============================================================================

/**
 * Create a subscription object for a business
 */
function createTrialSubscription(business, endDate) {
  const now = admin.firestore.Timestamp.now();

  // Try to extract created_at date for start_date
  let startDate = now;
  if (business.created_at) {
    startDate = business.created_at;
  }

  return {
    // Core identification
    type: 'trial',
    status: 'trial', // Active trial (already paid)
    plan: 'trial',
    billing_period: null, // null for trial

    // Important dates
    start_date: startDate,
    end_date: Timestamp.fromDate(endDate),
    current_period_start: null,
    current_period_end: null,
    next_payment_date: null,
    last_payment_date: startDate, // Assume they paid when they registered

    // Pricing
    amount: 20000, // 20k COP trial
    currency: 'COP',

    // MercadoPago integration (null for existing trials - manual migration)
    mercadopago_subscription_id: null,
    mercadopago_payer_id: null,
    mercadopago_payer_email: business.email || null,

    // Founder program tracking
    is_founder: business.is_founder || false,

    // Metadata
    created_at: startDate,
    updated_at: now,
  };
}

/**
 * Determine the trial end date for a business
 * Logic: 2 months from creation date, but never earlier than MINIMUM_TRIAL_END_DATE
 */
function getTrialEndDate(business, businessId) {
  // Check if this business has a special case by email
  if (business.email && SPECIAL_CASES[business.email]) {
    return SPECIAL_CASES[business.email];
  }

  // Check if this business has a special case by ID
  if (SPECIAL_CASES[businessId]) {
    return SPECIAL_CASES[businessId];
  }

  // Calculate end date as 2 months from creation date
  let calculatedEndDate = MINIMUM_TRIAL_END_DATE;

  if (business.created_at) {
    // Handle Firestore Timestamp
    const creationDate = business.created_at.toDate
      ? business.created_at.toDate()
      : new Date(business.created_at);

    // Add 2 months to creation date
    calculatedEndDate = new Date(creationDate);
    calculatedEndDate.setMonth(calculatedEndDate.getMonth() + TRIAL_DURATION_MONTHS);
    // Set to end of day
    calculatedEndDate.setHours(23, 59, 59, 999);
  }

  // Use the later of: calculated date OR minimum date
  if (calculatedEndDate < MINIMUM_TRIAL_END_DATE) {
    return MINIMUM_TRIAL_END_DATE;
  }

  return calculatedEndDate;
}

/**
 * Main migration function
 */
async function migrateTrialSubscriptions() {
  console.log('🚀 Starting trial subscription migration...\n');
  console.log(`📅 Trial duration: ${TRIAL_DURATION_MONTHS} months from creation date`);
  console.log(`📅 Minimum trial end date: ${MINIMUM_TRIAL_END_DATE.toISOString()}\n`);

  const businessesRef = db.collection('businesses');
  const snapshot = await businessesRef.get();

  if (snapshot.empty) {
    console.log('❌ No businesses found in database');
    return;
  }

  console.log(`📊 Found ${snapshot.size} businesses to check\n`);

  let migratedCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const migratedBusinesses = [];

  for (const doc of snapshot.docs) {
    const businessData = doc.data();
    const businessId = doc.id;

    // Skip if subscription object already exists
    if (businessData.subscription) {
      console.log(`⏭️  Skipping ${businessData.name || businessId} (already has subscription object)`);
      skipCount++;
      continue;
    }

    // Determine end date for this business
    const endDate = getTrialEndDate(businessData, businessId);

    // Create subscription object
    const subscription = createTrialSubscription(businessData, endDate);

    if (isDryRun) {
      console.log(`🔍 Would migrate: ${businessData.name || businessId}`);
      console.log(`   Email: ${businessData.email}`);
      console.log(`   Current plan: ${businessData.plan || 'none'}`);
      console.log(`   Trial end: ${endDate.toISOString()}`);
      console.log(`   Subscription object:`, JSON.stringify(subscription, null, 2).split('\n').map(l => '   ' + l).join('\n'));
      console.log('');
      migratedCount++;
      continue;
    }

    try {
      // Update the business document
      await businessesRef.doc(businessId).update({
        subscription: subscription,
        // Update legacy fields for backward compatibility
        subscription_status: 'trial',
        // Keep plan as enterprise for trial users (they get all features during trial)
        plan: businessData.plan || 'enterprise',
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Migrated: ${businessData.name || businessId}`);
      console.log(`   Trial ends: ${endDate.toLocaleDateString()}`);
      migratedCount++;

      migratedBusinesses.push({
        id: businessId,
        name: businessData.name,
        email: businessData.email,
        endDate: endDate.toISOString()
      });

    } catch (error) {
      console.log(`❌ Error migrating ${businessData.name || businessId}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📈 Migration Summary:');
  console.log('='.repeat(60));
  console.log(`   ✅ Migrated: ${migratedCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total: ${snapshot.size}`);
  console.log('='.repeat(60) + '\n');

  if (!isDryRun && migratedBusinesses.length > 0) {
    console.log('\n📋 Migrated businesses:');
    console.log(JSON.stringify(migratedBusinesses, null, 2));
  }

  process.exit(0);
}

// ============================================================================
// Command Line Interface
// ============================================================================

const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No changes will be made\n');
  migrateTrialSubscriptions().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
} else {
  console.log('⚠️  WARNING: This will modify your production database!\n');
  console.log('This script will:');
  console.log('  1. Add a subscription object to all businesses without one');
  console.log(`  2. Set trial end date to ${TRIAL_DURATION_MONTHS} months from creation date`);
  console.log(`  3. Minimum end date: ${MINIMUM_TRIAL_END_DATE.toISOString()}`);
  console.log('  4. Set subscription_status to "trial"');
  console.log('  5. Preserve existing plan fields\n');
  console.log('Run with --dry-run flag to preview changes first\n');

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('Type "yes" to continue: ', (answer) => {
    if (answer.toLowerCase() === 'yes') {
      readline.close();
      migrateTrialSubscriptions().catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
      });
    } else {
      console.log('Migration cancelled');
      readline.close();
      process.exit(0);
    }
  });
}
