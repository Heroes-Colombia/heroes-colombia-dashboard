# Business Onboarding Plan - Heroes Colombia Dashboard

## Overview
This document outlines the complete business onboarding flow from initial registration to becoming an active partner in the Heroes Colombia platform.

## Onboarding Stages

### Stage 1: Initial Registration
**Status: `pending`**

1. **Business Registration Form**
   - Basic business information (name, NIT, email, phone)
   - Business category selection (from categories collection)
   - Business description
   - Owner information (linked to user account)
   - Address and location data with geohash
   - Initial document uploads

2. **Account Creation**
   - Link business to user account via `owned_businesses` array
   - Set user permission to "business"
   - Generate business document ID

3. **Initial Data Storage**
   - Create business document with status "pending"
   - Store geolocation data with geohash for search optimization
   - Associate categories array for business classification

### Stage 2: Document Verification
**Status: `pending` → `under_review`**

1. **Required Documents**
   - RUT (Tax registration)
   - Cámara de Comercio (Chamber of Commerce certificate)
   - Cédula del representante legal (Legal representative ID)
   - Bank certification
   - Business license (if applicable)

2. **Admin Review Process**
   - Document verification dashboard for admins
   - Approval/rejection workflow with notes
   - Notification system for status updates

3. **Verification Criteria**
   - Document authenticity check
   - Business legitimacy verification
   - Category appropriateness review

### Stage 3: Business Profile Setup
**Status: `under_review` → `approved`**

1. **Business Details Completion**
   - Logo upload and featured image
   - Detailed business description
   - Website and social media links
   - Operating hours and contact information

2. **Location Management**
   - Physical location setup with precise coordinates
   - Service area definition
   - Multiple location support for franchises

3. **Initial Configuration**
   - Plan selection (gratis, básico, pro, enterprise)
   - Notification preferences setup
   - Payment method configuration (if premium plan)

### Stage 4: Team Management Setup
**Status: `approved`**

1. **Team Member Invitations**
   - Invite managers and staff members
   - Role assignment (owner, manager, staff)
   - Permission configuration per role

2. **Access Control**
   - Define team member responsibilities
   - Set up approval workflows for promotions
   - Configure redemption processing permissions

### Stage 5: First Promotion Creation
**Status: `active`**

1. **Promotion Setup Guidance**
   - Step-by-step promotion creation wizard
   - Best practices recommendations
   - Category-specific promotion templates

2. **Promotion Approval**
   - Admin moderation for first promotion
   - Quality guidelines enforcement
   - Hero community guidelines compliance

3. **Go-Live Preparation**
   - Final business profile review
   - Marketing material preparation
   - Launch timeline coordination

## Status Definitions

### Business Status Values
- **`pending`**: Initial registration, awaiting document submission
- **`under_review`**: Documents submitted, admin verification in progress
- **`approved`**: Verified business, can create promotions
- **`active`**: Fully operational with live promotions
- **`suspended`**: Temporarily disabled for policy violations
- **`rejected`**: Failed verification, account denied

### User Integration
- **User Permission**: `business` for business owners/managers
- **`owned_businesses`**: Array of business IDs user can manage
- **Business-User Relationship**: Many-to-many (users can own multiple businesses)

## Automation Opportunities

### Email Automation
1. Welcome email with next steps after registration
2. Document submission reminders
3. Approval/rejection notifications
4. Onboarding progress updates
5. First promotion creation guidance

### Workflow Automation
1. Auto-approve businesses based on criteria
2. Document validation using ML/OCR
3. Geolocation verification
4. Category suggestion based on business description

## Admin Dashboard Requirements

### Business Management
1. **Verification Queue**
   - Pending business reviews
   - Document verification interface
   - Bulk approval actions
   - Status change history

2. **Business Analytics**
   - Onboarding funnel metrics
   - Approval rates by category
   - Time-to-activation tracking
   - Regional distribution analysis

3. **Support Tools**
   - Business communication portal
   - Issue escalation system
   - Onboarding assistance chat

## Technical Implementation Notes

### Database Structure
- Businesses stored in `businesses` collection
- User-business relationship via `owned_businesses` array
- Document storage in Firebase Storage with references
- Geohash implementation for location-based queries

### Security Considerations
- Document access limited to business owners and admins
- PII protection for business owner information
- Audit trail for all status changes
- Rate limiting for registration attempts

### Integration Points
- Payment processor integration for premium plans
- Email service for automated communications
- SMS service for phone verification
- Maps API for location validation

## Success Metrics

### Onboarding KPIs
- Registration completion rate
- Document submission rate
- Approval rate and time
- Time to first promotion
- Business activation rate

### Business Quality Metrics
- Promotion engagement rates
- User satisfaction scores
- Business retention rates
- Revenue per business partner

## Next Steps for Implementation

1. **Phase 1**: Basic onboarding flow with manual admin approval
2. **Phase 2**: Enhanced automation and communication systems
3. **Phase 3**: Advanced analytics and optimization tools
4. **Phase 4**: Self-service capabilities and premium features

---

*This document should be reviewed and updated as the platform evolves and user feedback is incorporated.*