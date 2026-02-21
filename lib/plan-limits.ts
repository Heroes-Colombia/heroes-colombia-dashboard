/**
 * Heroes Colombia - Plan Limits Configuration
 *
 * This file defines all plan-based limits and features for subscription plans.
 * These limits are enforced throughout the dashboard UI and backend.
 *
 * IMPORTANT: These limits MUST match exactly what's documented in CLAUDE.md
 * and what's promised on the marketing website.
 */

export type PlanType = "fundador" | "basico" | "pro" | "enterprise"

export interface PlanLimits {
  // Resource Limits
  maxLocations: number
  maxActivePromotions: number | null // null = pay-per-promotion (Básico plan)
  maxUsers: number

  // Analytics Access
  analyticsLevel: "basic" | "advanced"
  perLocationAnalytics: boolean // Pro+ can see analytics broken down by location

  // Feature Flags
  audienceSegmentation: boolean // Target promotions by rank, location, etc.
  featuredBusiness: boolean // Premium badge, top of search results (Enterprise only)
  featuredPromotions: boolean // Featured carousel placement (Enterprise only)

  // Support Level
  support: "email" | "priority" | "dedicated"
}

/**
 * Plan limits configuration matching CLAUDE.md Feature Comparison Matrix
 */
export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  fundador: {
    maxLocations: Infinity, // Same as Enterprise
    maxActivePromotions: Infinity, // Same as Enterprise
    maxUsers: 10,
    analyticsLevel: "advanced",
    perLocationAnalytics: true,
    audienceSegmentation: true,
    featuredBusiness: true,
    featuredPromotions: true,
    support: "dedicated",
  },
  basico: {
    maxLocations: 1,
    maxActivePromotions: 2, // Per business, not per location
    maxUsers: 1,
    analyticsLevel: "basic",
    perLocationAnalytics: false,
    audienceSegmentation: false,
    featuredBusiness: false,
    featuredPromotions: false,
    support: "email",
  },
  pro: {
    maxLocations: 5,
    maxActivePromotions: 5, // Per business, not per location
    maxUsers: 3,
    analyticsLevel: "advanced",
    perLocationAnalytics: true, // Can see analytics per location
    audienceSegmentation: true,
    featuredBusiness: false,
    featuredPromotions: false,
    support: "priority",
  },
  enterprise: {
    maxLocations: Infinity, // Unlimited locations
    maxActivePromotions: Infinity, // Unlimited promotions
    maxUsers: 10,
    analyticsLevel: "advanced",
    perLocationAnalytics: true,
    audienceSegmentation: true,
    featuredBusiness: true,
    featuredPromotions: true,
    support: "dedicated",
  },
}

// ============================================================================
// PRICING CONSTANTS
// ============================================================================

/**
 * Cost per extra promotion (same as Básico plan pay-per-promotion)
 * Includes 19% IVA (10,000 + 1,900)
 */
export const EXTRA_PROMOTION_PRICE = 11900 // COP

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get plan limits for a specific plan
 */
export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan]
}

/**
 * Check if business can add a new location
 *
 * @param plan - Current business plan
 * @param currentLocationCount - Number of existing locations
 * @returns true if can add location
 */
export function canAddLocation(
  plan: PlanType,
  currentLocationCount: number
): boolean {
  const limits = getPlanLimits(plan)
  if (limits.maxLocations === Infinity) return true
  return currentLocationCount < limits.maxLocations
}

/**
 * Check if business can add a new promotion
 *
 * @param plan - Current business plan
 * @param currentActiveCount - Number of active promotions
 * @param extraPromotionsPurchased - Number of extra promotions purchased beyond plan limit
 * @returns Object with canAdd status, whether payment is required, and reason
 */
export function canAddPromotion(
  plan: PlanType,
  currentActiveCount: number,
  extraPromotionsPurchased: number = 0
): {
  canAdd: boolean
  requiresPayment: boolean
  reason?: string
} {
  const limits = getPlanLimits(plan)

  // Básico plan - always pay per promotion
  if (limits.maxActivePromotions === null) {
    return {
      canAdd: true,
      requiresPayment: true,
      reason: "pay_per_promotion",
    }
  }

  // Enterprise plan - unlimited
  if (limits.maxActivePromotions === Infinity) {
    return {
      canAdd: true,
      requiresPayment: false,
    }
  }

  // Básico/Pro plans with extra promotions
  const totalAllowed = limits.maxActivePromotions + extraPromotionsPurchased

  if (currentActiveCount < limits.maxActivePromotions) {
    // Within plan limits
    return {
      canAdd: true,
      requiresPayment: false,
    }
  } else if (currentActiveCount < totalAllowed) {
    // Using purchased extra slot
    return {
      canAdd: true,
      requiresPayment: false,
      reason: "using_extra_slot",
    }
  } else {
    // At limit - offer to buy more
    return {
      canAdd: false,
      requiresPayment: false,
      reason: "limit_reached_can_purchase",
    }
  }
}

/**
 * Check if business can add a new team member
 *
 * @param plan - Current business plan
 * @param currentTeamCount - Number of existing team members (including owner)
 * @returns true if can add team member
 */
export function canAddTeamMember(
  plan: PlanType,
  currentTeamCount: number
): boolean {
  const limits = getPlanLimits(plan)
  return currentTeamCount < limits.maxUsers
}

/**
 * Check if Básico plan requires payment per promotion
 *
 * @param plan - Current business plan
 * @returns true if plan requires payment per promotion
 */
export function requiresPaymentPerPromotion(plan: PlanType): boolean {
  return plan === "basico"
}

/**
 * Get total allowed promotions including purchased extras
 *
 * @param plan - Current business plan
 * @param extraPromotionsPurchased - Number of extra promotions purchased
 * @returns Total allowed promotions or 'unlimited'
 */
export function getTotalAllowedPromotions(
  plan: PlanType,
  extraPromotionsPurchased: number = 0
): number | "unlimited" {
  const limits = getPlanLimits(plan)

  if (limits.maxActivePromotions === null) {
    return "unlimited" // Básico pay-per-promo has no hard limit
  }

  if (limits.maxActivePromotions === Infinity) {
    return "unlimited"
  }

  return limits.maxActivePromotions + extraPromotionsPurchased
}

/**
 * Calculate remaining slots for a resource
 *
 * @param plan - Current business plan
 * @param resourceType - Type of resource
 * @param currentCount - Current count of resource
 * @param extraPurchased - Extra purchased (only for promotions)
 * @returns Remaining slots or 'unlimited'
 */
export function getRemainingSlots(
  plan: PlanType,
  resourceType: "locations" | "promotions" | "users",
  currentCount: number,
  extraPurchased: number = 0
): number | "unlimited" {
  const limits = getPlanLimits(plan)

  switch (resourceType) {
    case "locations":
      if (limits.maxLocations === Infinity) return "unlimited"
      return Math.max(0, limits.maxLocations - currentCount)

    case "promotions":
      if (limits.maxActivePromotions === null) return "unlimited"
      if (limits.maxActivePromotions === Infinity) return "unlimited"
      return Math.max(0, limits.maxActivePromotions + extraPurchased - currentCount)

    case "users":
      return Math.max(0, limits.maxUsers - currentCount)

    default:
      return 0
  }
}

/**
 * Check if plan has access to a specific feature
 *
 * @param plan - Current business plan
 * @param feature - Feature to check
 * @returns true if plan has access to feature
 */
export function hasFeatureAccess(
  plan: PlanType,
  feature: keyof Omit<PlanLimits, "maxLocations" | "maxActivePromotions" | "maxUsers">
): boolean {
  const limits = getPlanLimits(plan)
  const value = limits[feature]

  // For string values (like analyticsLevel), check if not basic
  if (feature === "analyticsLevel") {
    return value !== "basic"
  }

  // For boolean features
  return Boolean(value)
}

/**
 * Get recommended upgrade plan based on current usage
 *
 * @param currentPlan - Current business plan
 * @param reason - Reason for upgrade (what limit was hit)
 * @returns Recommended plan to upgrade to
 */
export function getRecommendedUpgradePlan(
  currentPlan: PlanType,
  reason?: "locations" | "promotions" | "users" | "analytics" | "features"
): PlanType {
  const upgradePath: Record<PlanType, PlanType> = {
    fundador: "fundador", // Fundador is a special tier, no upgrade needed
    basico: "pro",
    pro: "enterprise",
    enterprise: "enterprise", // Already at top
  }

  // If hitting location/promotion limits frequently, recommend jumping to Pro
  if (reason === "locations" || reason === "promotions") {
    if (currentPlan === "basico") {
      return "pro"
    }
  }

  return upgradePath[currentPlan]
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate if a plan downgrade is allowed based on current usage
 *
 * @param currentPlan - Current business plan
 * @param targetPlan - Target plan to downgrade to
 * @param currentUsage - Current resource usage
 * @returns Object with isAllowed and reason
 */
export function canDowngradePlan(
  currentPlan: PlanType,
  targetPlan: PlanType,
  currentUsage: {
    locations: number
    activePromotions: number
    teamMembers: number
  }
): {
  isAllowed: boolean
  reason?: string
  conflictingResource?: "locations" | "promotions" | "users"
} {
  const targetLimits = getPlanLimits(targetPlan)

  // Check locations
  if (
    targetLimits.maxLocations !== Infinity &&
    currentUsage.locations > targetLimits.maxLocations
  ) {
    return {
      isAllowed: false,
      reason: `Tienes ${currentUsage.locations} ubicaciones, pero el plan ${targetPlan} solo permite ${targetLimits.maxLocations}`,
      conflictingResource: "locations",
    }
  }

  // Check promotions
  if (
    targetLimits.maxActivePromotions !== null &&
    targetLimits.maxActivePromotions !== Infinity &&
    currentUsage.activePromotions > targetLimits.maxActivePromotions
  ) {
    return {
      isAllowed: false,
      reason: `Tienes ${currentUsage.activePromotions} promociones activas, pero el plan ${targetPlan} solo permite ${targetLimits.maxActivePromotions}`,
      conflictingResource: "promotions",
    }
  }

  // Check users
  if (currentUsage.teamMembers > targetLimits.maxUsers) {
    return {
      isAllowed: false,
      reason: `Tienes ${currentUsage.teamMembers} usuarios, pero el plan ${targetPlan} solo permite ${targetLimits.maxUsers}`,
      conflictingResource: "users",
    }
  }

  return {
    isAllowed: true,
  }
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get human-readable plan name
 */
export const PLAN_NAMES: Record<PlanType, string> = {
  fundador: "Fundador",
  basico: "Básico",
  pro: "Pro",
  enterprise: "Enterprise",
}

/**
 * Get human-readable resource name
 */
export const RESOURCE_NAMES = {
  locations: "Ubicaciones",
  promotions: "Promociones Activas",
  users: "Usuarios",
}

/**
 * Format limit for display (handles Infinity and null)
 */
export function formatLimit(limit: number | null): string {
  if (limit === null) return "Ilimitado (pago por uso)"
  if (limit === Infinity) return "Ilimitado"
  return limit.toString()
}
