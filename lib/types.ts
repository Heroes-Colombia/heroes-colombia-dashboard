// Heroes Colombia Dashboard - Data Models & Types
// Firebase Schema V2 - Aligned with Firebase collections structure
// Updated: January 2026

import type { Timestamp } from "firebase/firestore"

// ============================================================================
// Core Types
// ============================================================================

export type PlanType = "gratis" | "basico" | "pro" | "enterprise"
export type UserRole = "business" | "admin"
export type AdminPermission = "super_admin"
export type LocationType = "physical" | "online"
export type BusinessType = "physical" | "online" | "hybrid"
export type PromotionStatus = "active" | "inactive" | "expired"
export type BusinessStatus = "pending" | "active" | "inactive" | "approved" | "rejected" | "suspended"
export type UserVerificationStatus = "pending" | "active" | "rejected"
export type CategoryStatus = "active" | "inactive"
export type BillingPeriod = "monthly" | "annual"
export type SubscriptionStatus = "trial" | "active" | "past_due" | "cancelled" | "expired"

// ============================================================================
// Firebase GeoPoint Type
// ============================================================================

export interface GeoPoint {
  latitude: number
  longitude: number
}

export interface GeoHash {
  geohash: string
  geopoint: GeoPoint
}

// ============================================================================
// Business Types (Firebase Schema V2)
// ============================================================================

/**
 * Firebase business document structure
 * Collection: businesses/{businessId}
 */
export interface FirebaseBusiness {
  // Basic Information
  name: string
  identification: string
  email: string
  phone_number: string
  website?: string
  description?: string
  featured_image?: string

  // Owner Information
  owner_name: string
  owner_uid: string

  // Type & Categories
  type: BusinessType // "physical" | "online" | "hybrid"
  categories: string[] // Simple IDs like ["tecnologia", "restaurante"] matching category_id in business_categories

  // Primary Location (denormalized for geospatial queries)
  address: string
  location: GeoPoint | null // null for online-only businesses
  geo_hash: GeoHash | null

  // Status & Features
  status: BusinessStatus
  featured: boolean

  // Plan & Subscription
  plan: PlanType
  subscription_status: SubscriptionStatus

  // Plan Limits & Extra Resources
  extra_promotions_purchased?: number // Total extra promotions bought
  extra_promotions_active?: number // Currently active extra promotions

  // Timestamps
  created_at: Timestamp
  updated_at: Timestamp
}

/**
 * Firebase business location document (subcollection)
 * Collection: businesses/{businessId}/locations/{locationId}
 */
export interface FirebaseLocation {
  // Basic Information
  name: string
  is_primary: boolean // Exactly one location must be primary

  // Type
  type: LocationType // "physical" | "online"

  // Contact Information (ALL locations have these)
  phone?: string
  email?: string
  website?: string

  // Physical Location Fields
  address?: string | null
  location?: GeoPoint | null // null for online locations
  geo_hash?: GeoHash | null
  business_hours?: BusinessHours[]

  // Online Location Fields
  delivery_zones?: string[] // For online/hybrid businesses
  shipping_info?: string

  // Status
  status: "active" | "inactive"

  // Timestamps
  created_at: Timestamp
  updated_at: Timestamp
}

export interface BusinessHours {
  day_of_week: number // 0 = Sunday, 1 = Monday, etc.
  is_open: boolean
  open_time?: string // HH:mm format
  close_time?: string // HH:mm format
}

// ============================================================================
// Business Category Types (Firebase Schema V2)
// ============================================================================

/**
 * Firebase business category document
 * Collection: business_categories/{categoryId}
 */
export interface FirebaseBusinessCategory {
  category_id: string // e.g., "restaurant", "gym"
  name: string // Display name
  icon_url: string
  status: CategoryStatus
  sort_order: number
  created_at: Timestamp
  updated_at: Timestamp
}

// ============================================================================
// Promotion Types (Firebase Schema V2)
// ============================================================================

/**
 * Firebase promotion document
 * Collection: promotions/{promotionId}
 * Note: Renamed from "advertisements" collection
 */
export interface FirebasePromotion {
  // Basic Information
  business_id: string
  title: string
  description: string
  instructions: string
  percentage: number
  featured_image: string

  // Location Targeting
  location_ids: string[] // Empty array = applies to all locations

  // Dates
  expired_at: Timestamp
  created_at: Timestamp
  updated_at: Timestamp

  // Status & Visibility
  status: PromotionStatus
  is_featured: boolean

  // Analytics (updated by Cloud Functions)
  views_count?: number
  saves_count?: number
  redemptions_count?: number
}

// ============================================================================
// Subscription & Transaction Types (Firebase Schema V2)
// ============================================================================

/**
 * Firebase subscription document
 * Collection: subscriptions/{subscriptionId}
 */
export interface FirebaseSubscription {
  business_id: string
  plan: PlanType
  billing_period: BillingPeriod

  // Pricing
  amount: number // COP including IVA
  currency: "COP"

  // Status
  status: SubscriptionStatus
  is_trial: boolean
  trial_ends_at?: Timestamp

  // Dates
  current_period_start: Timestamp
  current_period_end: Timestamp
  cancelled_at?: Timestamp

  // Payment
  payment_method?: string
  last_payment_date?: Timestamp
  next_billing_date?: Timestamp

  // Metadata
  created_at: Timestamp
  updated_at: Timestamp
}

/**
 * Firebase transaction document
 * Collection: transactions/{transactionId}
 */
export interface FirebaseTransaction {
  business_id: string
  subscription_id?: string

  // Transaction Details
  type: "subscription" | "extra_promotion" | "trial"
  amount: number // COP including IVA
  currency: "COP"

  // Plan Information
  plan?: PlanType
  billing_period?: BillingPeriod

  // Extra Promotions Purchase
  extra_promotions_count?: number // Number of extra promotions purchased

  // Payment Details
  payment_method: "mercadopago" | "trial" | "admin_credit"
  payment_reference: string // MercadoPago reference
  payment_status: "pending" | "approved" | "rejected" | "cancelled"

  // Dates
  created_at: Timestamp
  approved_at?: Timestamp
  expiration_date?: Timestamp
}

// ============================================================================
// Analytics Types (Firebase Schema V2)
// ============================================================================

/**
 * Firebase analytics event document
 * Collection: analytics_events/{eventId}
 */
export interface FirebaseAnalyticsEvent {
  // Core
  entity_id: string
  entity_type: string
  event_type: "impression" | "view" | "save" | "redemption"
  business_id: string
  promotion_id?: string
  location_id?: string

  // User Data (V2 + V3 Demographics)
  user_id?: string
  user_rank?: string // For demographics
  user_city?: string
  user_type?: string
  user_sex?: "male" | "female" // V3 demographic field
  user_age_range?: "18-25" | "26-35" | "36-45" | "46-55" | "56-65" | "66+" | "under-18" // V3 demographic field

  // Context
  timestamp: Timestamp
  session_id?: string
  device_type?: "ios" | "android" | "web"

  // Metadata
  // created_at: Timestamp
}

// ============================================================================
// User & Authentication Types (Firebase Schema V2)
// ============================================================================

/**
 * Firebase user document (consumer)
 * Collection: users/{userId}
 */
export interface FirebaseConsumerUser {
  uid: string
  email: string
  user_type: "consumer"

  // Military Personnel Information
  first_name: string
  second_name?: string
  first_last_name: string
  second_last_name?: string
  identification_card: string
  license: string
  rank: string // Format: "BRANCH_CATEGORY_RANK"

  // Contact
  phone?: string
  city?: string

  // App Data
  favourite_businesses: string[]
  device_notification_token?: string

  // Status
  status: UserVerificationStatus
  verified: boolean

  // Timestamps
  created_at?: Timestamp
  updated_at?: Timestamp
}

/**
 * Firebase user document (business team member)
 * Collection: users/{userId}
 */
export interface FirebaseBusinessUser {
  uid: string
  email: string
  user_type: "business_team"

  // Name
  first_name: string
  second_name?: string
  first_last_name: string
  second_last_name?: string

  // Business Roles
  business_roles?: BusinessRole[]

  // Status
  status: "active" | "inactive"

  // Timestamps
  created_at?: Timestamp
  updated_at?: Timestamp
}

export interface BusinessRole {
  business_id: string
  role: BusinessPermission
  permissions: TeamPermissions
}

export enum BusinessPermission {
  owner = "owner",
  manager = "manager",
  staff = "staff",
}

export interface TeamPermissions {
  can_manage_promotions: boolean
  can_view_analytics: boolean
  can_manage_redemptions: boolean
  can_manage_team: boolean
  can_manage_locations: boolean
  can_view_billing: boolean
}

export const DEFAULT_PERMISSIONS = {
  [BusinessPermission.owner]: {
    can_manage_promotions: true,
    can_view_analytics: true,
    can_manage_redemptions: true,
    can_manage_team: true,
    can_manage_locations: true,
    can_view_billing: true,
  },
  [BusinessPermission.manager]: {
    can_manage_promotions: true,
    can_view_analytics: true,
    can_manage_redemptions: true,
    can_manage_team: false,
    can_manage_locations: true,
    can_view_billing: false,
  },
  [BusinessPermission.staff]: {
    can_manage_promotions: false,
    can_view_analytics: false,
    can_manage_redemptions: true,
    can_manage_team: false,
    can_manage_locations: false,
    can_view_billing: false,
  },
} as const

export type DefaultPermissionsType = typeof DEFAULT_PERMISSIONS

export type FirebaseUser = FirebaseConsumerUser | FirebaseBusinessUser

// ============================================================================
// Redemption Types (Firebase Schema V2 - Phase 2)
// ============================================================================

/**
 * Firebase redemption document
 * Collection: redemptions/{redemptionId}
 */
export interface FirebaseRedemption {
  promotion_id: string
  business_id: string
  location_id?: string

  // User Information
  user_id: string
  user_military_id: string

  // Redemption Details
  redeemed_at: Timestamp
  redemption_method: "manual" | "qr_code"
  processed_by?: string // Staff user ID

  // Status
  status: "completed" | "pending" | "cancelled"

  // Metadata
  created_at: Timestamp
}

// ============================================================================
// Dashboard UI Types (mapped from Firebase)
// ============================================================================

/**
 * Business profile for dashboard display
 * Mapped from FirebaseBusiness - using snake_case to match database
 */
export interface BusinessProfile {
  id: string
  name: string
  identification: string
  email: string
  phone_number: string
  website?: string
  description?: string
  featured_image?: string

  // Owner
  owner_name: string
  owner_uid: string

  // Type & Categories
  type: BusinessType
  categories: string[]

  // Primary Location
  address: string
  location: { latitude: number; longitude: number } | null
  geo_hash: {
    geohash: string
    geopoint: { latitude: number; longitude: number }
  } | null

  // Status
  status: BusinessStatus
  featured: boolean

  // Plan
  plan: PlanType
  subscription_status: SubscriptionStatus

  // Extra Resources
  extra_promotions_purchased?: number
  extra_promotions_active?: number

  // Dates
  created_at?: Date | any
  updated_at?: Date | any
}

/**
 * Business category for dashboard display
 * Mapped from FirebaseBusinessCategory
 */
export interface BusinessCategory {
  id: string
  category_id: string
  name: string
  image: string
  status: CategoryStatus
  sort_order: number
}

/**
 * Location for dashboard display
 * Mapped from FirebaseLocation
 */
export interface BusinessLocation {
  id: string
  name: string
  is_primary: boolean
  type: LocationType

  // Contact
  phone?: string
  email?: string
  website?: string

  // Physical
  address?: string
  location?: GeoPoint
  geo_hash?: GeoHash
  business_hours?: any

  // Online
  delivery_zones?: string[]
  delivery_type?: string
  whatsapp?: string

  // Status
  status: "active" | "inactive"

  // Dates
  created_at: Date | any
  updated_at: Date | any
}

/**
 * Promotion for dashboard display
 * Mapped from FirebasePromotion
 */
export interface Promotion {
  id: string
  business_id: string
  title: string
  description: string
  instructions: string
  percentage: number
  featured_image: string

  // Targeting
  location_ids: string[]

  // Dates
  expired_at: Date
  created_at: Date
  updated_at: Date

  // Status
  status: PromotionStatus
  is_featured: boolean

  // Analytics
  views_count?: number
  saves_count?: number
  redemptions_count?: number
}

/**
 * Subscription for dashboard display
 * Mapped from FirebaseSubscription
 */
export interface Subscription {
  id: string
  business_id: string
  plan: PlanType
  billing_period: BillingPeriod

  // Pricing
  amount: number
  currency: "COP"

  // Status
  status: SubscriptionStatus
  is_trial: boolean
  trial_ends_at?: Date | any

  // Dates
  current_period_start: Date | any
  current_period_end: Date | any
  cancelled_at?: Date | any
  next_billing_date?: Date | any

  // Payment
  payment_method?: string
  last_payment_date?: Date | any
}

/**
 * Transaction for dashboard display
 * Mapped from FirebaseTransaction
 */
export interface Transaction {
  id: string
  businessId: string
  subscriptionId?: string

  // Details
  type: "subscription" | "extra_promotion" | "trial"
  amount: number
  currency: "COP"

  // Plan
  plan?: PlanType
  billingPeriod?: BillingPeriod

  // Extra Promotions
  extraPromotionsCount?: number

  // Payment
  paymentMethod: string
  paymentReference: string
  paymentStatus: "pending" | "approved" | "rejected" | "cancelled"

  // Dates
  createdAt: Date
  approvedAt?: Date
  expirationDate?: Date
}

/**
 * Admin dashboard user interface
 * Mapped from FirebaseConsumerUser
 */
export interface AdminDashboardUser {
  id: string
  email: string
  name: string // first_name + first_last_name
  fullName: string // All name fields combined
  militaryId: string // identification_card
  rank: string
  branch: string
  phone?: string
  city?: string
  registrationDate: Date
  status: UserVerificationStatus
  notes?: string
  lastLogin?: Date
}

// ============================================================================
// Analytics Dashboard Types
// ============================================================================

export interface BusinessAnalytics {
  businessId: string
  periodStart: Date
  periodEnd: Date

  // Basic Metrics (All Plans)
  totalImpressions: number
  totalViews: number
  totalSaves: number
  totalRedemptions: number

  // Advanced Metrics (Pro+)
  conversionRate?: number
  revenueAttributed?: number
  userDemographics?: UserDemographics

  // Per-Location Analytics (Pro+)
  locationBreakdown?: LocationAnalytics[]

  // Trend Data
  dailyTrends?: DailyTrend[]
}

export interface LocationAnalytics {
  locationId: string
  locationName: string
  impressions: number
  views: number
  saves: number
  redemptions: number
}

export interface DailyTrend {
  date: string // YYYY-MM-DD
  impressions: number
  views: number
  saves: number
  redemptions: number
}

export interface UserDemographics {
  ageGroups: Record<string, number> // "18-25", "26-35", "36-45", "46-55", "56-65", "66+"
  sex: Record<"male" | "female", number> // V3: Gender distribution
  militaryRanks: Record<string, number>
  cities: Record<string, number>
}

// ============================================================================
// Form Types (for UI components)
// ============================================================================

export interface CreateLocationForm {
  name: string
  type: LocationType
  isPrimary: boolean

  // Contact
  phone?: string
  email?: string
  website?: string

  // Physical
  address?: string
  location?: {
    latitude: number
    longitude: number
  }
  businessHours?: BusinessHours[]

  // Online
  deliveryZones?: string[]
  shippingInfo?: string
}

export interface CreatePromotionForm {
  title: string
  description: string
  instructions: string
  percentage: number
  featuredImage: string
  locationIds: string[]
  expiredAt: Date
  isFeatured: boolean
}

export interface UpdateBusinessForm {
  name?: string
  email?: string
  phoneNumber?: string
  website?: string
  description?: string
  categoryIds?: string[]
  featuredImage?: string
}

export interface PurchaseExtraPromotionsForm {
  quantity: number
  paymentMethod: "mercadopago"
}

export interface SelectPlanForm {
  plan: PlanType
  billingPeriod: BillingPeriod
  paymentMethod: "mercadopago" | "trial"
  applyEarlyBird: boolean
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
// System Configuration Types
// ============================================================================

export interface SystemSettings {
  id: "global"

  // Platform
  platformName: string
  platformVersion: string
  maintenanceMode: boolean

  // Business Rules
  autoApproveBusinesses: boolean
  autoApprovePromotions: boolean
  maxPromotionDuration: number // days

  // Payment
  mercadoPagoConfig?: {
    publicKey: string
    accessToken: string
    environment: "test" | "production"
  }

  // Metadata
  updatedAt: Timestamp
  updatedBy: string
}

export interface NotificationPreferences {
  email: boolean
  promotions: boolean
  billing: boolean
  systemUpdates: boolean
}

// ============================================================================
// Legacy Type Aliases & Missing Exports (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use Promotion instead - renamed in Schema V2
 * Kept for backward compatibility with old code referencing advertisements
 */
export type Advertisement = Promotion

/**
 * Redemption for dashboard display
 */
export interface Redemption {
  id: string
  promotion_id: string
  business_id: string
  location_id?: string
  user_id: string
  user_military_id: string
  redeemed_at: Date | any
  redemption_method: "manual" | "qr_code"
  processed_by?: string
  status: "completed" | "pending" | "cancelled"
  created_at: Date | any
}

/**
 * Team member dashboard type
 */
export interface TeamMember {
  id: string
  uid: string
  email: string
  first_name: string
  last_name: string
  role: BusinessPermission
  permissions: TeamPermissions
  business_roles?: BusinessRole[]
  status: "active" | "inactive" | "pending"
  verified?: boolean
  created_at: Date | any
  updated_at?: Date | any
  // Add any other fields from FirebaseBusinessUser or BusinessRole that are used
}
