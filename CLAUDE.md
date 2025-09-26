# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run lint` - Run ESLint
- `npm start` - Start production server

### Firebase Integration
This project uses Firebase for authentication, database, and storage. Firebase emulators should be used for development. The Firebase configuration is in `/lib/firebase.ts` and requires environment variables to be set.

## Architecture Overview

### Project Structure
This is a **Next.js 14 application** with **App Router** serving as a dual-purpose dashboard for Heroes Colombia - a platform connecting Colombian military personnel with business discounts.

### Two Primary User Flows

#### Business Dashboard (`/app/business/`)
- **Authentication**: Business owners log in and manage their company profiles
- **Core Pages**: locations, team, promotions, redemptions, analytics, billing, settings
- **Layout**: Uses `/app/business/dashboard/layout.tsx` with navigation sidebar

#### Admin Dashboard (`/app/admin/`)
- **Authentication**: Platform administrators with elevated permissions
- **Core Pages**: businesses, users (verification queue), promotions (moderation), plans (subscription management), settings (platform configuration)
- **Layout**: Uses `/app/admin/dashboard/layout.tsx` with admin-specific navigation

### Data Architecture

#### Type System (`/lib/types.ts`)
- **Comprehensive TypeScript interfaces** for all business entities
- **Role-based access control**: UserRole, BusinessPermission, AdminPermission
- **Plan types**: "gratis" | "basico" | "pro" | "enterprise" with feature differentiation
- **Firebase integration**: Uses Timestamp types for dates

#### Firebase Schema
```
users/{userId} - User profiles and authentication
businesses/{businessId}/ - Business profiles
├── locations/{locationId} - Physical/online business locations
├── team_members/{memberId} - Team invitations and permissions
├── promotions/{promotionId} - Business promotions
├── redemptions/{redemptionId} - Transaction records
└── analytics/{analyticsId} - Performance metrics
```

#### Security Model
- **Firebase Custom Claims** for role-based access (owner, manager, staff, admin)
- **Tenant isolation** - all business data segregated by businessId
- **Security rules** in `/firestore.rules` using custom claims for performance
- **Plan-based feature limiting** enforced in UI components

### UI Component System

#### Design Framework
- **Radix UI** + **Tailwind CSS** for component primitives
- **Consistent patterns**: All dashboard pages follow the same card-based layout from `/app/business/dashboard/promotions/page.tsx`
- **Colombian localization**: Currency (COP), Spanish text, local business categories
- **Responsive design**: Desktop-first with mobile considerations

#### Form Handling
- **React Hook Form** + **Zod** for validation (`/lib/validations.ts`)
- **Spanish error messages** and local business rule validation
- **Plan limit enforcement** in form components with upgrade prompts

### Key Features

#### Business Management
- **Location Management**: Physical addresses with coordinates, online stores with delivery zones, business hours management
- **Team Management**: Role-based invitations (owner/manager/staff), granular permissions, invitation workflow
- **Promotion System**: Multiple types (percentage, fixed, BOGO, free shipping), scheduling, plan-based featuring
- **Redemption Processing**: Manual check-in system, military ID verification, transaction tracking

#### Admin Operations
- **User Verification Queue**: Military document review, verification scoring, approval workflow
- **Promotion Moderation**: Content review, approval/rejection with notes, flagging system
- **Subscription Management**: Plan configuration, pricing, feature toggles, usage analytics
- **Platform Settings**: System-wide configuration, email templates, payment integration, notification rules

### Data Management

#### Export Functionality (`/lib/export-utils.ts`)
- **CSV exports** for all data types with Colombian formatting
- **Date range filtering** and business summary reports
- **Plan-based export limits** and feature restrictions

#### Seed Data (`/lib/seed-data.ts`)
- **Development mock data** with realistic Colombian business scenarios
- **Multi-business test data** with different plans and statuses
- **Complete relationship modeling** across users, businesses, locations, promotions

### Development Context

#### MVP Implementation Status
- **Phase 1 COMPLETED** (Business Dashboard): All core business functionality implemented
- **Phase 2.1 COMPLETED** (Admin Dashboard): User verification, promotion moderation, plan management, settings
- **Next Phase**: Enhanced analytics with TanStack Query v5, Tremor components for charts

#### Architectural Decisions Made
1. **Firebase Custom Claims over Firestore RBAC** - Better performance and security
2. **Plan-based feature limiting** - All UI components respect subscription boundaries
3. **Tenant isolation pattern** - Strict data segregation by businessId
4. **Spanish-first localization** - All user-facing text and business logic adapted for Colombia

#### Code Patterns to Follow
- **Page Structure**: Follow `/app/business/dashboard/locations/page.tsx` for layout consistency
- **Type Safety**: Use interfaces from `/lib/types.ts`, avoid `any` types
- **Form Validation**: Use Zod schemas from `/lib/validations.ts` with Spanish messages
- **Plan Enforcement**: Check user plan before showing premium features, show upgrade prompts
- **Export Integration**: Use utilities from `/lib/export-utils.ts` for data exports

#### Authentication Context
The app uses a custom `AuthProvider` (`/hooks/use-auth`) that wraps Firebase Auth and provides user context throughout the application. Pages automatically redirect based on user role and authentication status.