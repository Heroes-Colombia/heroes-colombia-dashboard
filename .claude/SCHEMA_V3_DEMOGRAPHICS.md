# Firebase Schema V3 - Demographics Enhancement

## Overview
This document describes the V3 schema enhancements for user demographics tracking in the Heroes Colombia platform. These changes enable age and gender analytics for better business insights.

**Status:** ✅ Implemented
**Date:** January 2026
**Impact:** Mobile App + Dashboard Analytics

---

## Mobile App Changes (Flutter)

### 1. User Model Updates
**File:** `heroesapp/lib/src/domain/models/user_model.dart`

#### New Fields Added:
```dart
// V3 Schema Fields - Demographics & Preferences
final DateTime? dateOfBirth;           // User's date of birth for age calculation
final String? sex;                     // "male" | "female"
final List<String>? preferredCategories; // User's preferred business categories
final List<String>? familyInvitations;  // Email list of invited family members
```

#### New Helper Methods:
```dart
// Calculate age from date of birth
int? get age { ... }

// Get age range for analytics
// Returns: "18-25", "26-35", "36-45", "46-55", "56-65", "66+", "under-18"
String? get ageRange { ... }
```

### 2. Analytics Service Updates
**File:** `heroesapp/lib/src/domain/services/analytics_service.dart`

#### New Analytics Fields:
```dart
// Build event data matching Dashboard schema
final eventData = {
  // ... existing fields ...
  'user_sex': _userContext?['sex'],         // V3 demographic field
  'user_age_range': _userContext?['age_range'], // V3 demographic field
};
```

**Performance Optimization:**
- Age calculation happens **once** at login when `initializeSession()` is called
- Computed value (e.g., "26-35") is stored as a **string** in `_userContext` map
- All subsequent analytics events just **read the cached string** - no date calculations
- Age range only recalculates when user logs in again (typically once per session)

### 3. Signup Flow Restructured
**File:** `heroesapp/lib/src/presentation/pages/auth/pages/signup_view.dart`

#### New 3-Step Onboarding Flow:

**Step 1: Cuenta (Account)**
- Email + Password
- Terms & Privacy acceptance

**Step 2: Información Personal (Personal Details)**
- First name, last names
- **Date of birth picker** (validates 18+)
- **Sex toggle** (friendly segmented control: Masculino/Femenino)
- Rank selector

**Step 3: Familia y Preferencias (Family & Preferences)**
- Family invitations (gamified: invite 3 for exclusive benefits)
- Category preferences (optional)

#### Military Verification:
- **Removed** from signup flow (deferred to redemption phase next year)
- Reduces signup friction for military users concerned about data privacy

---

## Dashboard Changes (TypeScript)

### 1. Analytics Event Schema
**File:** `heroes-colombia-dashboard/lib/types.ts`

#### Updated `FirebaseAnalyticsEvent` Interface:
```typescript
export interface FirebaseAnalyticsEvent {
  // Core fields
  entity_id: string
  entity_type: string
  event_type: "impression" | "view" | "save" | "redemption"
  business_id: string

  // User Data (V2 + V3 Demographics)
  user_id?: string
  user_rank?: string
  user_city?: string
  user_type?: string
  user_sex?: "male" | "female"           // ✨ V3 NEW
  user_age_range?: "18-25" | "26-35" | "36-45" | "46-55" | "56-65" | "66+" | "under-18" // ✨ V3 NEW

  // Context
  timestamp: Timestamp
  session_id?: string
  device_type?: "ios" | "android" | "web"
}
```

### 2. User Demographics Schema
**File:** `heroes-colombia-dashboard/lib/types.ts`

#### Updated `UserDemographics` Interface:
```typescript
export interface UserDemographics {
  ageGroups: Record<string, number>          // "18-25", "26-35", etc.
  sex: Record<"male" | "female", number>     // ✨ V3 NEW: Gender distribution
  militaryRanks: Record<string, number>
  cities: Record<string, number>
}
```

### 3. Analytics Utilities
**File:** `heroes-colombia-dashboard/lib/analytics-utils.ts`

#### Updated `AdvancedAnalytics` Interface:
```typescript
export interface AdvancedAnalytics extends BasicAnalytics {
  conversionRate: number
  revenue: number
  averageRevenuePerRedemption: number
  demographics: {
    age: Array<{ range: string; value: number }>    // ✨ V3 NEW
    sex: Array<{ sex: string; value: number }>      // ✨ V3 NEW
    rank: Array<{ rank: string; value: number }>
    cities: Array<{ city: string; users: number }>
  }
}
```

#### Updated `calculateDemographics()` Function:
Now processes:
- ✅ Age range distribution from `user_age_range` field
- ✅ Sex distribution from `user_sex` field
- ✅ Military rank distribution (existing)
- ✅ City distribution (existing)

**Output Example:**
```typescript
{
  age: [
    { range: "18-25", value: 15 },
    { range: "26-35", value: 35 },
    { range: "36-45", value: 28 },
    { range: "46-55", value: 18 },
    { range: "56-65", value: 4 }
  ],
  sex: [
    { sex: "Masculino", value: 68 },
    { sex: "Femenino", value: 32 }
  ],
  rank: [ /* existing format */ ],
  cities: [ /* existing format */ ]
}
```

---

## Firestore Schema Changes

### Collection: `users/{userId}`

#### New Fields:
```javascript
{
  // Existing fields...

  // V3 Demographics (optional)
  date_of_birth: "1990-05-15T00:00:00.000Z",  // ISO 8601 string
  sex: "male",                                  // "male" | "female"
  preferred_categories: ["Restaurantes", "Gimnasios"], // Array of category names
  family_invitations: ["email1@example.com", "email2@example.com"] // Array of emails
}
```

### Collection: `analytics_events/{eventId}`

#### New Fields:
```javascript
{
  // Existing fields...
  event_type: "impression",
  entity_type: "business",
  entity_id: "businessId123",
  business_id: "businessId123",
  user_id: "userId123",
  user_rank: "ARMY_OFFICER_CAPTAIN",
  user_city: "Bogotá",

  // V3 Demographics (optional - only present if user provided data)
  user_sex: "male",                    // "male" | "female"
  user_age_range: "26-35",             // "18-25" | "26-35" | "36-45" | "46-55" | "56-65" | "66+" | "under-18"

  timestamp: FirebaseTimestamp,
  session_id: "sessionId123"
}
```

---

## Age Range Calculation Logic

### Age Ranges:
- `"under-18"` - Users under 18 (validation prevents signup)
- `"18-25"` - Young adults
- `"26-35"` - Early career
- `"36-45"` - Mid career
- `"46-55"` - Late career
- `"56-65"` - Pre-retirement
- `"66+"` - Retirement age

### Calculation:
```dart
int age = today.year - dateOfBirth.year;
if (today.month < dateOfBirth.month ||
    (today.month == dateOfBirth.month && today.day < dateOfBirth.day)) {
  age--;
}
```

### Caching Strategy:
1. **At Login:** Calculate age range once from `dateOfBirth`
2. **Store:** Save computed string (`"26-35"`) in analytics service `_userContext`
3. **Analytics Events:** Read cached string value (O(1) lookup)
4. **Recalculation:** Only happens on next login (typically once per session)

---

## Dashboard Analytics Impact

### New Analytics Capabilities:

#### 1. **Age Distribution Chart**
- Shows percentage of users in each age range
- Helps businesses target promotions by age group
- Example: "35% of your customers are 26-35 years old"

#### 2. **Gender Distribution Chart**
- Shows male/female percentage breakdown
- Helps understand customer base composition
- Example: "68% Masculino, 32% Femenino"

#### 3. **Cross-Demographic Insights**
- Combine age + sex + rank for deeper insights
- Example: "26-35 year old female officers redeem 40% more spa promotions"

#### 4. **Segmentation for Targeting**
- Filter analytics by age range or gender
- Create targeted promotions for specific demographics
- Example: "Create fitness promotion targeting 18-25 males"

---

## Privacy & Compliance

### Data Collection:
- ✅ Date of birth collected during signup
- ✅ Sex collected during signup (optional toggle)
- ✅ User consent via Terms & Privacy acceptance

### Data Storage:
- ✅ Date of birth stored as ISO 8601 string in Firestore
- ✅ Only age range (not exact age) transmitted in analytics events
- ✅ Personal data encrypted in transit and at rest

### Data Usage:
- ✅ Used only for analytics aggregation
- ✅ No personally identifiable information (PII) exposed in dashboard
- ✅ Age ranges provide anonymization
- ✅ Users can update preferences in profile settings (future feature)

---

## Migration Notes

### Backward Compatibility:
- ✅ All V3 fields are **optional**
- ✅ Existing users without demographics still work
- ✅ Analytics gracefully handle missing demographic data
- ✅ Dashboard shows "N/A" for users without demographics

### Rollout Strategy:
1. ✅ Update mobile app with new signup flow
2. ✅ New signups collect demographics automatically
3. ✅ Existing users: demographics remain empty (optional future update flow)
4. ✅ Dashboard shows mixed data (some users with/without demographics)
5. ✅ Over time, demographics coverage increases as new users sign up

---

## Testing Checklist

### Mobile App:
- [ ] Signup flow: Account step validates email uniqueness
- [ ] Signup flow: Personal details validates date of birth (18+)
- [ ] Signup flow: Sex toggle works correctly
- [ ] Signup flow: Family invitations save correctly
- [ ] Analytics: Age range calculated correctly at login
- [ ] Analytics: Sex field transmitted in analytics events

### Dashboard:
- [ ] Analytics page: Age distribution chart displays correctly
- [ ] Analytics page: Gender distribution chart displays correctly
- [ ] Analytics page: Demographics handle missing data gracefully
- [ ] Analytics page: Percentages sum to 100%
- [ ] Types: TypeScript compiles without errors

---

## Future Enhancements

### Planned Features:
1. **User Profile Edit:** Allow users to update demographics in settings
2. **Preference-Based Recommendations:** Use preferred categories for personalized feed
3. **Family Invitation Tracking:** Track which users invited family members
4. **Advanced Segmentation:** Multi-dimensional filtering (age + sex + rank + city)
5. **Predictive Analytics:** Use demographics to predict promotion performance

---

## Support & Documentation

### Related Files:
- Mobile App: `heroesapp/lib/src/domain/models/user_model.dart`
- Mobile App: `heroesapp/lib/src/presentation/pages/auth/pages/signup_view.dart`
- Dashboard: `heroes-colombia-dashboard/lib/types.ts`
- Dashboard: `heroes-colombia-dashboard/lib/analytics-utils.ts`

### Questions?
Contact the development team for clarification on V3 schema implementation.
