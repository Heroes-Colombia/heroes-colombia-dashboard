# Heroes Colombia Dashboard

Business management dashboard for the Heroes Colombia ecosystem - connecting Colombian businesses with military personnel and government employees.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/jonathan-gonzalezs-projects/v0-heroes-colombia-dashboard)

## 🎯 Overview

**Heroes Colombia Dashboard** is a Next.js 14 application serving as the central management platform for business owners participating in the Heroes Colombia ecosystem. The platform enables businesses to:

- 📍 Manage multiple physical and online locations
- 🎁 Create and manage promotions with location targeting
- 👥 Invite team members with role-based permissions
- 📊 Track redemptions and view analytics
- 💳 Manage billing and subscriptions
- ⚙️ Configure business settings

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore and Authentication
- Google Maps API key
- MercadoPago account (for payments)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the dashboard.

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure (Simplified)

```
heroes-colombia-dashboard/
├── app/
│   ├── business/
│   │   └── dashboard/          # Business owner dashboard
│   │       ├── page.tsx        # Dashboard home (stats, quick actions)
│   │       ├── locations/      # Location management (CRUD + edit/delete)
│   │       ├── promotions/     # Promotion management (create, edit, target locations)
│   │       ├── team/           # Team member invitations & permissions
│   │       ├── redemptions/    # Process & track redemptions
│   │       ├── analytics/      # View performance metrics
│   │       ├── billing/        # Subscription & plan management
│   │       └── settings/       # Business profile & preferences
│   │
│   └── admin/
│       └── dashboard/          # Admin dashboard (user verification, content moderation)
│
├── components/
│   ├── ui/                     # shadcn/ui components (Button, Card, Dialog, etc.)
│   ├── location-picker-modal.tsx  # Google Maps location selector
│   ├── plan-limit-badge.tsx   # Show usage vs. plan limits
│   ├── upgrade-plan-button.tsx # Upgrade CTA for locked features
│   └── locked-feature.tsx     # Display locked premium features
│
├── lib/
│   ├── firebase.ts            # Firebase config & initialization
│   ├── firebase-storage.ts    # Image upload utilities
│   ├── services/              # Firebase service layer
│   │   ├── location-service.ts    # Location CRUD operations
│   │   ├── promotion-service.ts   # Promotion CRUD operations
│   │   ├── user-service.ts        # User management
│   │   ├── analytics-service.ts   # Analytics data
│   │   └── ...
│   ├── plan-limits.ts         # Plan-based feature limits
│   ├── types.ts               # TypeScript interfaces
│   └── utils/                 # Helper functions
│
├── hooks/
│   └── use-auth.ts            # Authentication context & user state
│
└── public/                    # Static assets

```

## 🗂️ Key Pages & Features

### Business Dashboard (`/business/dashboard`)

| Page | Path | Description | Key Features |
|------|------|-------------|--------------|
| **Home** | `/business/dashboard` | Overview with stats & quick actions | Active promotions count, recent redemptions, quick create buttons |
| **Locations** | `/business/dashboard/locations` | Manage business locations | ✅ Create/Edit/Delete locations, Google Maps picker, Primary location selection, Multiple location support, Plan limit enforcement |
| **Promotions** | `/business/dashboard/promotions` | Manage offers & discounts | ✅ Create/Edit/Delete promotions, Location targeting, Image upload, Expiration dates, Status management (active/inactive/expired), **Fixed bug**: Can now edit location targeting |
| **Team** | `/business/dashboard/team` | Invite & manage team members | Role-based permissions (owner/manager/staff), Email invitations, Access control |
| **Redemptions** | `/business/dashboard/redemptions` | Track promotion usage | Manual check-in, Military ID verification, Transaction history |
| **Analytics** | `/business/dashboard/analytics` | Performance metrics | Basic/Advanced analytics based on plan, Charts & graphs, Export data |
| **Billing** | `/business/dashboard/billing` | Subscription management | Plan selection, Upgrade/downgrade, Invoice history, Usage tracking |
| **Settings** | `/business/dashboard/settings` | Business configuration | Profile editing, Notification preferences, Account settings |

### Recent Improvements

#### ✅ **Locations Page** (Latest Updates)
- **Edit Functionality**: Click edit button to modify location details (name, type, contact info, map coordinates)
- **Delete Functionality**: Delete non-primary locations with safety checks
- **Tooltips**: Hover over disabled delete button shows: "No puedes eliminar la ubicación principal. Marca otra ubicación como principal primero."
- **Prominent Primary Indicator**: Primary location has:
  - 👑 Crown icon with "PRINCIPAL" badge
  - Yellow highlight background
  - Border accent
- **Promotion Safety Check**: Cannot delete location if it has active promotions
- **Responsive Design**: Mobile-friendly grids and layouts

#### ✅ **Promotions Page** (Bug Fix)
- **Location Targeting Fix**: Can now edit promotion locations when editing
- **Previous Bug**: Location checkboxes were disabled when "All locations" was selected
- **Solution**: Removed incorrect `disabled` condition, allowing free editing of location targets

## 🔥 Firebase Schema (Collections)

### Collections Structure

```
firestore/
├── users/{userId}
├── businesses/{businessId}/
│   ├── locations/{locationId}         # Physical/online locations
│   ├── team_members/{memberId}        # Staff invitations
│   └── (promotions moved to top-level)
├── promotions/{promotionId}           # Business promotions (Schema V2)
├── business_categories/{categoryId}   # Category master data
├── redemptions/{redemptionId}         # Transaction records
├── invitations/{invitationId}         # Family member invitations
└── analytics/{analyticsId}            # Performance metrics
```

### Key Schema Details

**Locations** (`businesses/{businessId}/locations/{locationId}`):
```typescript
{
  name: string
  type: "physical" | "online"
  is_primary: boolean
  address?: string
  location?: GeoPoint
  geo_hash?: { geohash: string, geopoint: GeoPoint }
  phone?: string
  email?: string
  website?: string
  status: "active" | "inactive"
}
```

**Promotions** (`promotions/{promotionId}`):
```typescript
{
  business_id: string
  title: string
  description: string
  percentage: number (1-100)
  featured_image: string
  location_ids: string[]  // Empty = all locations
  expired_at: Timestamp
  status: "draft" | "pending" | "active" | "inactive" | "expired"
  is_featured: boolean
}
```

## 💳 Plan Limits (Enforced)

| Resource | Gratis | Básico | Pro | Enterprise |
|----------|--------|--------|-----|------------|
| **Locations** | 1 | 3 | 10 | ∞ |
| **Active Promotions** | Pay-per-use | 3 | 10 | ∞ |
| **Team Members** | 1 | 2 | 5 | 10 |
| **Analytics** | Basic | Basic | Advanced | Advanced |

**Plan enforcement is implemented across all pages** - users see upgrade prompts when limits are reached.

## 🔧 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Maps**: Google Maps JavaScript API
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context (AuthProvider)
- **Icons**: Lucide React
- **Date**: date-fns
- **Payments**: MercadoPago

## 🛠️ Development Commands

```bash
# Development
npm run dev              # Start dev server

# Building
npm run build           # Build production bundle
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking

# Firebase
firebase emulators:start  # Run local Firebase emulators
```

## 🌍 Environment Variables

Create a `.env.local` file with these variables:

```bash
# Firebase (client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_WEB=

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=

# URLs
NEXT_PUBLIC_DASHBOARD_URL=https://app.heroescolombia.com
NEXT_PUBLIC_WEBSITE_URL=https://heroescolombia.com
```

## 📝 Key Services

### Location Service (`lib/services/location-service.ts`)
- `getBusinessLocations(businessId)` - Fetch all locations
- `createLocation(businessId, data)` - Create new location
- `updateLocation(businessId, locationId, data)` - Update location
- `deleteLocation(businessId, locationId)` - Delete location
- `setPrimaryLocation(businessId, locationId)` - Set primary location

### Promotion Service (`lib/services/promotion-service.ts`)
- `getPromotions(filters)` - Fetch promotions with filters
- `createPromotion(data)` - Create new promotion
- `updatePromotion(promotionId, data)` - Update promotion
- `deletePromotion(promotionId)` - Delete promotion (includes image cleanup)

## 🎨 UI Components

### Reusable Components

- **`<LocationPickerModal />`**: Google Maps integration for selecting coordinates
- **`<PlanLimitBadge />`**: Shows usage vs. limits (e.g., "2/3 Locations")
- **`<UpgradePlanButton />`**: CTA for upgrading plan
- **`<LockedFeature />`**: Display for premium features
- **`<ImageUpload />`**: Firebase Storage image uploader

## 🔐 Authentication & Permissions

**User Roles**:
- `admin` - Platform administrators
- `business_team` - Business owners and staff
- `consumer` - Military personnel (app users)

**Business Permissions** (team members):
- `can_manage_promotions` - Create/edit promotions
- `can_manage_locations` - Edit business locations
- `can_manage_team` - Invite team members
- `can_process_redemptions` - Validate promotion usage
- `can_view_analytics` - Access analytics dashboard

## 📚 Additional Documentation

- **`CLAUDE.md`** - Comprehensive guide for AI coding assistance (pricing, architecture, feature details)
- **`.claude/tasks/`** - Implementation task guides and planning documents
  - `SCHEMA_V2_MIGRATION_GUIDE.md` - Firebase schema migration guide
  - `ANALYTICS_EVENT_TRACKING_GUIDE.md` - Analytics implementation
  - `FAMILY_INVITATION_SYSTEM_IMPLEMENTATION.md` - Family member invitations

## 🐛 Bug Fixes & Known Issues

### ✅ Recently Fixed
1. **Promotion Location Editing**: Fixed disabled checkboxes preventing location changes
2. **Location Primary Indicator**: Added prominent crown badge for primary locations
3. **Delete Button Tooltips**: Added helpful tooltips explaining why delete is disabled

### 🔄 Current Known Issues
None currently reported.

## 🤝 Related Projects

- **heroes-colombia-website** - Marketing website & trial signup
- **heroesapp** - Flutter mobile app for military personnel (consumer app)

## 📄 License

Proprietary - Heroes Colombia

## 👨‍💻 Developer Notes

When working on this project:
1. **Always read `CLAUDE.md`** for detailed guidance
2. **Check plan limits** before implementing new features
3. **Use existing services** in `lib/services/` for Firebase operations
4. **Follow existing UI patterns** from locations/promotions pages
5. **Test with different plans** (Gratis, Básico, Pro, Enterprise)
6. **Use TypeScript strictly** - avoid `any` types
7. **Keep security rules in sync** with Firestore structure

---

**Last Updated**: November 10, 2024
**Dashboard Version**: v2.0 (Schema V2 migration complete)
