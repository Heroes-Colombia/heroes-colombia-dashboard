/**
 * Heroes Colombia - Dynamic Pricing Configuration
 *
 * This file controls all pricing across different launch phases.
 * Update this file to change pricing without touching components.
 */

export interface TrialOffer {
  enabled: boolean
  price: number // COP including 19% IVA
  duration: number // days
  badge: string
  headline: string
  description: string
  nextBillingDate: Date // When trial ends and plan selection is due
}

export interface EarlyBirdIncentive {
  enabled: boolean
  deadline: Date
  discount: number // percentage (e.g., 50 for 50% off)
  badge: string
  description: string
}

export interface PlanPricing {
  monthly: number // COP including IVA
  annual: number // COP including IVA
  savings: number // COP saved on annual
  savingsPercent: number // percentage
}

export interface RegularPlans {
  basico: PlanPricing
  pro: PlanPricing
  enterprise: PlanPricing
}

export interface PricingPeriod {
  id: string
  name: string
  startDate: Date
  endDate: Date | null // null = ongoing indefinitely
  trialOffer?: TrialOffer
  earlyBirdIncentive?: EarlyBirdIncentive
  regularPlans: RegularPlans
}

// ============================================================================
// PRICING PERIODS CONFIGURATION
// ============================================================================

export const PRICING_PERIODS: PricingPeriod[] = [
  // -------------------------------------------------------------------------
  // PRE-LAUNCH PHASE (Oct 6 - Nov 30, 2024)
  // -------------------------------------------------------------------------
  {
    id: "pre-launch",
    name: "Pre-Lanzamiento",
    startDate: new Date("2025-10-06T00:00:00-05:00"), // Colombia timezone
    endDate: new Date("2025-12-06T23:59:59-05:00"),

    trialOffer: {
      enabled: true,
      price: 20000,
      duration: 119, // Days until Feb 1, 2026 (Oct 6 → Feb 1 = ~119 days)
      badge: "🎉 Pre-Lanzamiento - Primeros 100 Negocios",
      headline: "20,000 COP",
      description: "Pago único por acceso completo al plan Enterprise",
      nextBillingDate: new Date("2026-02-01T00:00:00-05:00"),
    },

    earlyBirdIncentive: {
      enabled: false,
      deadline: new Date("2026-01-15T23:59:59-05:00"),
      discount: 50, // 50% off first month
      badge: "⚡ Oferta Especial",
      description: "Selecciona tu plan antes del 15 de enero y obtén 50% de descuento en tu primer mes",
    },

    regularPlans: {
      basico: {
        monthly: 100000,
        annual: 1020000,
        savings: 180000,
        savingsPercent: 15,
      },
      pro: {
        monthly: 270000,
        annual: 2754000, // 270,000 × 12 × 0.85
        savings: 486000,
        savingsPercent: 15,
      },
      enterprise: {
        monthly: 800000,
        annual: 8160000, // 800,000 × 12 × 0.85
        savings: 1440000,
        savingsPercent: 15,
      },
    },
  },

  // -------------------------------------------------------------------------
  // LAUNCH PHASE (Dec 1, 2024 - Jan 31, 2026)
  // -------------------------------------------------------------------------
  {
    id: "launch",
    name: "Lanzamiento",
    startDate: new Date("2025-12-05T00:00:00-05:00"),
    endDate: new Date("2026-01-31T23:59:59-05:00"),

    trialOffer: {
      enabled: true,
      price: 20000,
      duration: 61, // Days until Feb 1, 2026 (varies by signup date)
      badge: "🚀 Lanzamiento - Únete a los Primeros 100",
      headline: "20,000 COP",
      description: "Pago único por acceso completo hasta Febrero 1, 2026",
      nextBillingDate: new Date("2026-02-01T00:00:00-05:00"),
    },

    earlyBirdIncentive: {
      enabled: false,
      deadline: new Date("2026-01-15T23:59:59-05:00"),
      discount: 50,
      badge: "⚡ Últimos Días",
      description: "Selecciona tu plan antes del 15 de enero y obtén 50% de descuento en tu primer mes",
    },

    regularPlans: {
      basico: {
        monthly: 100000,
        annual: 1020000,
        savings: 180000,
        savingsPercent: 15,
      },
      pro: {
        monthly: 270000,
        annual: 2754000,
        savings: 486000,
        savingsPercent: 15,
      },
      enterprise: {
        monthly: 800000,
        annual: 8160000,
        savings: 1440000,
        savingsPercent: 15,
      },
    },
  },

  // -------------------------------------------------------------------------
  // POST-LAUNCH PHASE (Feb 1, 2026+)
  // -------------------------------------------------------------------------
  {
    id: "post-launch",
    name: "Post-Lanzamiento",
    startDate: new Date("2026-02-01T00:00:00-05:00"),
    endDate: null, // Ongoing

    // Trial offer disabled - can be re-enabled with different pricing
    trialOffer: undefined,

    // No early bird incentive after launch period
    earlyBirdIncentive: undefined,

    regularPlans: {
      basico: {
        monthly: 100000,
        annual: 1020000,
        savings: 180000,
        savingsPercent: 15,
      },
      pro: {
        monthly: 270000,
        annual: 2754000,
        savings: 486000,
        savingsPercent: 15,
      },
      enterprise: {
        monthly: 800000,
        annual: 8160000,
        savings: 1440000,
        savingsPercent: 15,
      },
    },
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the current active pricing period based on today's date
 */
export function getCurrentPricing(): PricingPeriod {
  const now = new Date()

  const activePeriod = PRICING_PERIODS.find((period) => {
    const isAfterStart = now >= period.startDate
    const isBeforeEnd = !period.endDate || now <= period.endDate
    return isAfterStart && isBeforeEnd
  })

  // Fallback to last period if no match (shouldn't happen)
  return activePeriod || PRICING_PERIODS[PRICING_PERIODS.length - 1]
}

/**
 * Check if trial offer is currently available
 */
export function isTrialOfferActive(): boolean {
  const pricing = getCurrentPricing()
  return pricing.trialOffer?.enabled ?? false
}

/**
 * Get current trial price
 */
export function getTrialPrice(): number {
  const pricing = getCurrentPricing()
  return pricing.trialOffer?.price ?? 0
}

/**
 * Get trial duration in days
 */
export function getTrialDuration(): number {
  const pricing = getCurrentPricing()
  return pricing.trialOffer?.duration ?? 0
}

/**
 * Check if early bird incentive is currently available
 */
export function isEarlyBirdActive(): boolean {
  const pricing = getCurrentPricing()
  if (!pricing.earlyBirdIncentive?.enabled) return false

  const now = new Date()
  return now <= pricing.earlyBirdIncentive.deadline
}

/**
 * Get early bird discount percentage
 */
export function getEarlyBirdDiscount(): number {
  const pricing = getCurrentPricing()
  return pricing.earlyBirdIncentive?.discount ?? 0
}

/**
 * Calculate days remaining until early bird deadline
 */
export function getEarlyBirdDaysRemaining(): number {
  const pricing = getCurrentPricing()
  if (!pricing.earlyBirdIncentive?.enabled) return 0

  const now = new Date()
  const deadline = pricing.earlyBirdIncentive.deadline
  const diff = deadline.getTime() - now.getTime()

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/**
 * Calculate days remaining until trial offer ends
 */
export function getTrialOfferDaysRemaining(): number {
  const pricing = getCurrentPricing()
  if (!pricing.endDate) return 0

  const now = new Date()
  const diff = pricing.endDate.getTime() - now.getTime()

  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

/**
 * Calculate discounted price for early bird
 */
export function calculateEarlyBirdPrice(
  plan: "basico" | "pro" | "enterprise",
  billingPeriod: "monthly" | "annual"
): number {
  const pricing = getCurrentPricing()
  const planPricing = pricing.regularPlans[plan]
  const basePrice = planPricing[billingPeriod]

  if (!isEarlyBirdActive()) return basePrice

  const discount = getEarlyBirdDiscount()

  // For annual plans, apply discount only to first month equivalent
  if (billingPeriod === "annual") {
    const monthlyPrice = planPricing.monthly
    const discountedFirstMonth = monthlyPrice * (1 - discount / 100)
    const remainingMonths = monthlyPrice * 11
    return Math.round(discountedFirstMonth + remainingMonths)
  }

  // For monthly, just discount the first month
  return Math.round(basePrice * (1 - discount / 100))
}

/**
 * Format price for display (COP with thousands separator)
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Format price without currency symbol
 */
export function formatPriceSimple(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Check if the app has been launched (December 5, 2025)
 */
export function isAppLaunched(): boolean {
  const now = new Date()
  const launchDate = new Date("2025-12-04T00:00:00-05:00") // Colombia timezone
  return now >= launchDate
}

// ============================================================================
// TYPE EXPORTS FOR COMPONENTS
// ============================================================================

export type PlanType = "basico" | "pro" | "enterprise"
export type BillingPeriod = "monthly" | "annual"
