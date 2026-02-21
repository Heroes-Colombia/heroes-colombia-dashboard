import { BusinessService } from "./business-service"
import { checkOnboardingComplete } from "@/hooks/use-onboarding-progress"
import type { BusinessProfile, Promotion, BusinessLocation } from "@/lib/types"

/**
 * Service for managing business onboarding status
 * Handles automatic status transitions when onboarding is complete
 */
export class OnboardingService {
  /**
   * Check if required onboarding fields are complete
   */
  static isOnboardingComplete(
    business: BusinessProfile | null,
    promotions: Promotion[],
    locations: BusinessLocation[]
  ): boolean {
    return checkOnboardingComplete(business, promotions, locations)
  }

  /**
   * Activate business if onboarding is complete
   * Only updates status if business is currently "pending"
   * Returns true if status was updated, false otherwise
   */
  static async activateIfOnboardingComplete(
    businessId: string,
    business: BusinessProfile | null,
    promotions: Promotion[],
    locations: BusinessLocation[]
  ): Promise<boolean> {
    // Guard: Must have business data
    if (!business) {
      return false
    }

    // Guard: Only transition from pending to active
    if (business.status !== "pending") {
      return false
    }

    // Check if onboarding is complete
    const isComplete = this.isOnboardingComplete(business, promotions, locations)

    if (!isComplete) {
      return false
    }

    // Update business status to active
    const success = await BusinessService.updateBusinessStatus(
      businessId,
      "active",
      "Onboarding completado automaticamente"
    )

    if (success) {
      console.log(`[OnboardingService] Business ${businessId} activated - onboarding complete`)
    } else {
      console.error(`[OnboardingService] Failed to activate business ${businessId}`)
    }

    return success
  }

  /**
   * Get missing required fields for onboarding
   * Useful for debugging and showing specific requirements
   */
  static getMissingRequiredFields(
    business: BusinessProfile | null,
    promotions: Promotion[],
    locations: BusinessLocation[]
  ): string[] {
    if (!business) {
      return ["business_data"]
    }

    const missing: string[] = []
    const now = new Date()

    // Check locations
    if (locations.length === 0) {
      missing.push("locations")
    }

    // Check active promotions
    const hasActivePromotion = promotions.some((p) => {
      if (p.status !== "active") return false
      const expiredAt = p.expired_at
      if (expiredAt && typeof expiredAt === "object" && "seconds" in expiredAt) {
        return new Date((expiredAt as any).seconds * 1000) > now
      }
      return new Date(expiredAt) > now
    })

    if (!hasActivePromotion) {
      missing.push("promotions")
    }

    // Check phone number
    if (!business.phone_number || business.phone_number.trim() === "") {
      missing.push("phone_number")
    }

    // Check featured image
    if (!business.featured_image) {
      missing.push("featured_image")
    }

    return missing
  }
}
