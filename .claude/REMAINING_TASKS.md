# Heroes Colombia Dashboard - Remaining Tasks

**Last Updated:** January 20, 2026
**Dashboard Status:** ✅ Week 1-2 Complete (All migrations done, security rules deployed)
**Schema Version:** V2 (with V1 compatibility)
**Next Phase:** Flutter App V2 Updates

---

## 📋 Summary: What's Done vs What's Left

### ✅ Completed (Week 1-2) - Dashboard Ready for Production!

1. **Pricing & Plan System**
   - ✅ Pricing configuration with early bird & trial support
   - ✅ Plan limits enforcement across all features
   - ✅ UI components (UpgradePlanButton, PlanLimitBadge, LockedFeature)

2. **Dashboard Pages - Schema V2 Integration**
   - ✅ Locations page (subcollection CRUD)
   - ✅ Promotions page (new `promotions` collection)
   - ✅ Team page (business_roles structure)
   - ✅ Analytics page (tiered access)
   - ✅ Plans page (comparison & selection)
   - ✅ Billing page (overview & redirect to plans)

3. **Firebase Service Layer**
   - ✅ Locations subcollection functions
   - ✅ Promotions V2 collection functions
   - ✅ Team member management functions
   - ✅ Business, categories, subscriptions

4. **Database Migrations (EXECUTED)**
   - ✅ User type migration (V1 → V2 schema)
   - ✅ Locations subcollection migration
   - ✅ Promotions collection migration (advertisements → promotions)
   - ✅ All migrations completed successfully

5. **Security Rules**
   - ✅ Schema V2 rules created and validated
   - ✅ Deployed to production
   - ✅ V1/V2 backward compatibility maintained

---

## 🔴 HIGH PRIORITY - Next Steps

### 1. Database Migration Scripts ✅ COMPLETE

**Status:** ✅ All migrations executed successfully

#### A. User Type Migration ✅ EXECUTED
**File:** `/scripts/migrate-user-types.js`

**Status:** ✅ Migration completed

**What it did:**
- Added `user_type` field to all existing users
- Mapped `permission` → `user_type` (kept both for compatibility)
- Initialized `business_roles` array for business users

#### B. Category Structure ✅ NO MIGRATION NEEDED
**Status:** Production DB already uses correct simple ID structure!

**Current Production (CORRECT):**
```javascript
// business_categories collection
{ category_id: "tecnologia", name: "Tecnología", image: "..." }
{ category_id: "restaurante", name: "Restaurantes", image: "..." }

// businesses collection
{ categories: ["tecnologia", "restaurante"] }  // Stores simple IDs
```

**Action Required:** Update dashboard types/docs to match production (NOT change database)

#### C. Locations Subcollection Migration ✅ EXECUTED
**File:** `/scripts/migrate-locations.js`

**Status:** ✅ Migration completed

**What it did:**
- Created `businesses/{id}/locations` subcollection with primary location
- Copied location/address/contact data from parent business doc
- Set `is_primary: true` on first location
- Kept parent location/address fields (Flutter app compatibility)
- Enabled multi-location support via dashboard

#### D. Advertisements → Promotions Rename ✅ EXECUTED
**File:** `/scripts/migrate-promotions.js`

**Status:** ✅ Migration completed

**What it did:**
- Copied all documents from `advertisements` → `promotions` collection
- Updated field names to V2 schema (business_id, location_ids, etc.)
- Added new analytics fields: `views_count`, `saves_count`, `redemptions_count`
- Added location targeting: `location_ids` array (empty = all locations)
- Preserved original advertisement IDs (for reference tracking)
- Kept old `advertisements` collection (safe rollback until Flutter app migrates)

---

### 2. Firebase Security Rules Update ✅ COMPLETE

**Status:** ✅ Complete

**File:** `/firestore.rules` ✅ Updated to Schema V2

**What was added:**
- ✅ V2 helper functions using `user_type` and `business_roles`
- ✅ Rules for `businesses/{businessId}/locations` subcollection
- ✅ Rules for `promotions` collection
- ✅ Rules for legacy `advertisements` collection (backward compatibility)
- ✅ Rules for `business_categories` (public read)
- ✅ Rules for `subscriptions` collection
- ✅ Rules for `redemptions` collection (Phase 2)
- ✅ V1/V2 backward compatibility (checks both schemas)
- ✅ Field validation (prevents users from changing critical fields)

**Key Security Features:**
- Public can read active businesses/promotions (mobile app)
- Business team members can only access their own business data
- Admins have full access
- Users cannot escalate their own permissions
- Business roles are properly validated

---

### 3. Authentication Schema V2 Sync ✅ COMPLETE

**Status:** ✅ Complete

**What was done:**
- Updated `registerBusiness()` to create users with V2 schema (`user_type`, `business_roles`)
- Updated `loginWithEmail()` to check both V1 and V2 fields
- Updated `loginWithGoogle()` to use hybrid V1+V2 schema
- Updated `createAdminUser()` to use V2 schema
- Updated `getCurrentUser()` to check `user_type === "business_team"` and `user_type === "admin"`
- Created primary location in subcollection during business registration
- Verified build compiles successfully

**Backward Compatibility:** ✅ Maintained
- V1 `permission` field still written and read
- V2 `user_type` field added alongside
- Both old and new users can log in

---

## 🟡 MEDIUM PRIORITY - Week 2

### 4. Payment Integration (MercadoPago)

**Status:** ❌ TODO

**Features Needed:**
- Plan subscription checkout flow
- Pay-per-promotion for Gratis plan
- Webhook handling for payment confirmations
- Subscription status updates

**Reference:** Week 1 plan has placeholders in:
- `/app/business/dashboard/plans/page.tsx`
- `/app/business/dashboard/promotions/page.tsx` (pay-per-promotion)

---

### 5. Email/Notification System

**Status:** ❌ TODO

**Use Cases:**
- Team member invitation emails
- Plan upgrade notifications
- Billing reminders
- Promotion approval/rejection

**Suggested:** Use SendGrid or Firebase Cloud Messaging

---

### 6. Image Upload System

**Status:** ❌ TODO

**Current:** All image upload inputs are disabled/placeholder

**Needed:**
- Firebase Storage integration
- Image upload for promotions (`featured_image`)
- Image upload for businesses (`featured_image`)
- Image compression/optimization

---

### 7. Flutter App Schema V2 Updates

**Status:** ⏳ Documented, Not Implemented

**See:** `/heroesapp/CLAUDE.md` (updated with V2 schema docs)

**Flutter App Changes Needed:**
1. Add `user_type` field to User model (optional compatibility)
2. Add `business_roles` field to User model
3. Migrate from `advertisements` to `promotions` collection
4. Update business model to support multiple locations
5. Handle category IDs instead of category strings

**Timeline:** Week 2-3

---

## 🟢 LOW PRIORITY - Future Enhancements

### 8. Admin Dashboard Features

**Status:** ❌ TODO

**Features:**
- User verification/approval workflow
- Business verification/approval workflow
- Platform analytics
- Moderation tools

---

### 9. Advanced Analytics

**Status:** ⚠️ Basic Implementation

**Current:** Analytics page has tiered access but uses mock data

**Enhancements Needed:**
- Real-time dashboard widgets
- Export to CSV/PDF
- Custom date range filtering
- Comparison metrics (month-over-month, etc.)

---

### 10. Testing & Documentation

**Status:** ❌ TODO

**Needed:**
- Unit tests for Firebase service functions
- Integration tests for plan limits
- E2E tests for critical flows
- API documentation
- User guides for business owners

---

## 📊 Migration Checklist

Before going to production, complete in order:

- [x] 1. Run user type migration script (`migrate-user-types.js`) ✅
- [x] 2. Category schema verified (no migration needed - production correct) ✅
- [x] 3. Auth layer updated to V2 schema (registration, login, etc.) ✅
- [x] 4. Run locations migration script (`migrate-locations.js`) ✅
- [x] 5. Promotions migration script created (`migrate-promotions.js`) ✅
- [x] 6. Run promotions migration script ✅
- [x] 7. Firebase security rules updated and validated ✅
- [x] 8. Deploy Firebase security rules ✅
- [ ] 9. Update Flutter app to Schema V2
- [ ] 10. Test cross-platform compatibility
- [ ] 11. Deploy to production (dashboard first, then Flutter app)

---

## 🔗 Related Documents

- **Dashboard Schema:** `/.claude/FIREBASE_SCHEMA_V2.md`
- **Flutter App Docs:** `/heroesapp/CLAUDE.md` (updated with V2 schema)
- **Week 1 Plan:** `/.claude/tasks/WEEK1_DASHBOARD_IMPLEMENTATION.md`
- **Migration Scripts:** `/scripts/`

---

## 🚨 Critical Path to Production

**Priority Order:**

1. ✅ Week 1 core features (DONE)
2. ✅ Auth layer V2 schema sync (DONE)
3. ✅ Category schema verification (DONE - no migration needed)
4. ✅ Migration scripts created (user types, locations, promotions - DONE)
5. ✅ User type migration executed (DONE)
6. ✅ Locations migration executed (DONE)
7. ✅ Promotions migration executed (DONE)
8. ✅ Security rules updated and deployed (DONE)
9. 🔴 Flutter app V2 updates (NEXT - see heroesapp/CLAUDE.md)
10. 🟡 Payment integration (for revenue)
11. 🟢 Enhanced features (analytics, admin, etc.)

**Estimated Timeline:**
- ✅ Week 1-2: Core dashboard + migrations (COMPLETE)
- 🔴 Week 3: Flutter app V2 updates (NEXT)
- 🟡 Week 4: Payment integration
- 🟢 Week 5+: Enhanced features

---

**Last Updated:** January 20, 2026
**Next Review:** After completing migrations
