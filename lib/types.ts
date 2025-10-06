// Heroes Colombia Dashboard - Data Models & Types
// Based on the documented business requirements and Firebase schema

import type { Timestamp } from "firebase/firestore"

// ============================================================================
// Core Types
// ============================================================================

export type PlanType = "gratis" | "basico" | "pro" | "enterprise"
export type UserRole = "business" | "admin"
export type BusinessPermission = "owner" | "manager" | "staff"
export type AdminPermission = "super_admin"
export type LocationType = "physical" | "online"
export type PromotionType = "percentage" | "fixed" | "bogo" | "free_shipping" | "flash_deal"
export type PromotionStatus = "draft" | "active" | "expired" | "suspended"
export type BusinessStatus = "pending" | "approved" | "suspended" | "rejected"
export type UserVerificationStatus = "pending" | "approved" | "rejected"
export type CategoryStatus = "active" | "inactive"

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface BaseUser {
  id: string
  email: string
  role: UserRole
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
}

// Firebase User document structure (matches actual Firestore data)
export interface FirebaseUser {
  uid: string
  email: string
  device_notification_token?: string
  favourite_businesses: string[]
  first_name: string
  second_name?: string
  first_last_name: string
  second_last_name?: string
  identification_card: string
  license: string
  password: string // Note: This should not be stored in Firestore in production
  permission: "user" | "admin"
  rank: string // Format: "BRANCH_CATEGORY_RANK"
  status: "pending" | "active" | "rejected"
  verified: boolean
  phone?: string
  city?: string
  notes?: string // Admin notes field
}

// Admin dashboard user interface (mapped from Firebase data)
export interface AdminDashboardUser {
  id: string
  email: string
  name: string // first_name + first_last_name
  fullName: string // first_name + second_name + first_last_name + second_last_name
  militaryId: string // identification_card
  rank: string
  branch: string
  phone?: string
  city?: string
  registrationDate: Date
  status: "pending" | "active" | "rejected"
  notes?: string
  lastLogin?: Date
}

export interface BusinessUser extends BaseUser {
  role: "business"
  businessId: string
  businessName: string
  plan: PlanType
  permissions: BusinessPermission[]
  status: BusinessStatus
}

export interface AdminUser extends BaseUser {
  role: "admin"
  permissions: AdminPermission[]
}

export type User = BusinessUser | AdminUser

// ============================================================================
// Category Types
// ============================================================================

export interface BusinessCategory {
  category_id: string
  name: string
  image: string
  status: CategoryStatus
}

// ============================================================================
// Business & Organization Types
// ============================================================================

export interface BusinessProfile {
  id: string
  name: string // Firebase field name
  identification: string // Business NIT/identification
  email: string
  phone_number: string // Firebase field name
  phoneNumber?: string // Alternative phone field
  categories: string[] // Array of category IDs
  description?: string
  featured_image?: string // Firebase field name
  website?: string
  address: string

  // Owner Information
  owner_name: string
  owner_uid: string // Link to user account

  // Location Data
  location: GeoPoint // Firebase GeoPoint
  geo_hash: {
    geohash: string
    geopoint: GeoPoint
  }

  // Status & Features
  status: "pending" | "under_review" | "approved" | "active" | "suspended" | "rejected"
  featured: boolean
  reviews: any[] // Review array

  // Plan & Billing (extended fields)
  plan?: PlanType
  planStartDate?: Date | Timestamp
  planEndDate?: Date | Timestamp
  billingEmail?: string

  // Verification Documents
  verificationDocuments?: string[]
  verificationNotes?: string

  // Settings
  notificationPreferences?: NotificationPreferences

  // Metadata
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
  lastActiveAt?: Date | Timestamp
}

// Firebase GeoPoint type
export interface GeoPoint {
  latitude: number
  longitude: number
}

export interface NotificationPreferences {
  email: boolean
  promotions: boolean
  billing: boolean
  systemUpdates: boolean
}

// ============================================================================
// Location Types
// ============================================================================

export interface BusinessLocation {
  id: string
  businessId: string
  name: string
  type: LocationType

  // Physical location fields
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  coordinates?: {
    latitude: number
    longitude: number
  }
  businessHours?: BusinessHours[]

  // Online location fields
  website?: string
  deliveryZones?: string[]
  onlineContactInfo?: {
    phone?: string
    email?: string
    whatsapp?: string
  }

  // Status
  isActive: boolean

  // Metadata
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
}

export interface BusinessHours {
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  isOpen: boolean
  openTime?: string // HH:mm format
  closeTime?: string // HH:mm format
}

// ============================================================================
// Team Management Types
// ============================================================================

export interface TeamMember {
  id: string
  businessId: string
  userId?: string // null if invitation pending
  email: string
  name?: string
  role: BusinessPermission

  // Invitation Status
  invitationStatus: "pending" | "accepted" | "rejected"
  invitedBy: string
  invitedAt: Date | Timestamp
  acceptedAt?: Date | Timestamp

  // Access Control
  isActive: boolean
  permissions: TeamPermissions

  // Metadata
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
}

export interface TeamPermissions {
  canManagePromotions: boolean
  canViewAnalytics: boolean
  canManageRedemptions: boolean
  canManageTeam: boolean
  canManageLocations: boolean
  canViewBilling: boolean
}

// ============================================================================
// Promotion Types
// ============================================================================

// Firebase Advertisement/Promotion Interface
export interface Advertisement {
  id: string
  business_id: string // Firebase field name
  title: string
  description: string
  instructions: string
  percentage: number
  featured_image: string
  expired_at: Date | Timestamp
  status: "active" | "inactive"

  // Extended fields for dashboard functionality
  createdAt?: Date | Timestamp
  updatedAt?: Date | Timestamp
}

// Legacy Promotion interface - extends Advertisement for backward compatibility
export interface Promotion extends Advertisement {
  // Legacy fields mapped from Advertisement
  businessId: string // Maps to business_id
  type: PromotionType
  value: number // Maps to percentage
  originalPrice?: number
  discountedPrice?: number
  startDate: Date | Timestamp
  endDate: Date | Timestamp // Maps to expired_at
  isActive: boolean // Maps to status === "active"
  currentRedemptions: number
  maxRedemptions?: number
  maxRedemptionsPerUser?: number
  digitalCardEligible: boolean
  targetLocations?: string[]
  targetUserCategories?: string[]
  isFeatured: boolean
  featuredUntil?: Date | Timestamp
  createdBy: string

  // BOGO specific
  bogoDetails?: {
    buyQuantity: number
    getQuantity: number
    applicableItems?: string[]
  }
}

// ============================================================================
// Redemption Types
// ============================================================================

export interface Redemption {
  id: string
  promotionId: string
  businessId: string
  locationId?: string

  // User Information
  userId: string
  userMilitaryId: string
  userEmail?: string

  // Redemption Details
  redeemedAt: Date | Timestamp
  redeemedBy: string // staff member who processed
  redemptionMethod: "manual" | "qr_code" | "digital_card"

  // Transaction Details
  originalAmount?: number
  discountAmount?: number
  finalAmount?: number

  // Verification
  verificationNotes?: string
  verificationPhoto?: string

  // Status
  status: "completed" | "pending" | "cancelled"

  // Metadata
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface BusinessAnalytics {
  id: string
  businessId: string
  periodStart: Date | Timestamp
  periodEnd: Date | Timestamp

  // Basic Metrics (All Plans)
  totalImpressions: number
  totalViews: number
  totalRedemptions: number

  // Pro+ Metrics
  conversionRate?: number
  revenueAttributed?: number
  userDemographics?: UserDemographics

  // Enterprise Metrics
  cohortData?: CohortAnalysis[]
  heatmapData?: HeatmapData
  benchmarkData?: BenchmarkData

  // Metadata
  createdAt: Date | Timestamp
  calculatedAt: Date | Timestamp
}

export interface UserDemographics {
  ageGroups: Record<string, number>
  militaryRanks: Record<string, number>
  cities: Record<string, number>
  familyMembers: number
}

export interface CohortAnalysis {
  cohortMonth: string
  retentionRates: number[]
  lifetimeValue: number
}

export interface HeatmapData {
  locationId: string
  interactionCount: number
  coordinates: {
    latitude: number
    longitude: number
  }
}

export interface BenchmarkData {
  industry: string
  metric: string
  value: number
  percentile: number
}

// ============================================================================
// Plan Configuration Types
// ============================================================================

export interface PlanConfiguration {
  id: PlanType
  name: string
  price: number // in COP
  currency: "COP"
  billingCycle: "monthly" | "annual"

  // Limits
  maxLocations: number | "unlimited"
  maxPromotions: number | "unlimited"
  maxTeamMembers: number | "unlimited"

  // Features
  features: PlanFeatures

  // Analytics Access
  analyticsLevel: "basic" | "advanced" | "enterprise"

  // Support
  supportLevel: "email" | "email_chat" | "dedicated"

  // Status
  isActive: boolean

  // Metadata
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
}

export interface PlanFeatures {
  basicAnalytics: boolean
  advancedAnalytics: boolean
  enterpriseAnalytics: boolean
  teamManagement: boolean
  priorityListings: boolean
  featuredPromotions: boolean
  apiAccess: boolean
  customCampaigns: boolean
  dedicatedManager: boolean
}

// ============================================================================
// System Configuration Types
// ============================================================================

export interface SystemSettings {
  id: "global"

  // Platform Settings
  platformName: string
  platformVersion: string
  maintenanceMode: boolean

  // Business Rules
  autoApproveBusinesses: boolean
  autoApprovePromotions: boolean
  maxPromotionDuration: number // in days

  // Email Settings
  mailerliteApiKey?: string
  emailTemplates: EmailTemplateConfig[]

  // Payment Settings
  wompiConfig?: {
    publicKey: string
    environment: "test" | "production"
  }

  // Notification Settings
  notificationRules: NotificationRule[]

  // Metadata
  updatedAt: Date | Timestamp
  updatedBy: string
}

export interface EmailTemplateConfig {
  id: string
  name: string
  subject: string
  template: string
  variables: string[]
}

export interface NotificationRule {
  id: string
  event: string
  channels: ("email" | "push" | "sms")[]
  recipients: ("business" | "admin" | "user")[]
  template: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

// ============================================================================
// Form Types (for UI components)
// ============================================================================

export interface CreateLocationForm {
  name: string
  type: LocationType
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  website?: string
  businessHours?: BusinessHours[]
}

export interface CreatePromotionForm {
  title: string
  description: string
  type: PromotionType
  value: number
  startDate: Date
  endDate: Date
  maxRedemptions?: number
  targetLocations: string[]
  digitalCardEligible: boolean
}

export interface InviteTeamMemberForm {
  email: string
  role: BusinessPermission
  permissions: Partial<TeamPermissions>
}

export interface ProcessRedemptionForm {
  promotionId: string
  userMilitaryId: string
  locationId?: string
  verificationNotes?: string
  originalAmount?: number
  discountAmount?: number
}