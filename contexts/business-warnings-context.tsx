"use client"

import { createContext, useContext, useState, useEffect, useMemo, useRef, type ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useBusinessWarnings } from "@/hooks/use-business-warnings"
import { useOnboardingProgress, type OnboardingProgress } from "@/hooks/use-onboarding-progress"
import { PromotionService } from "@/lib/services/promotion-service"
import { LocationService } from "@/lib/services/location-service"
import { BusinessService } from "@/lib/services/business-service"
import { OnboardingService } from "@/lib/services/onboarding-service"
import type { DashboardWarning, BusinessProfile, Promotion, BusinessLocation, WarningType } from "@/lib/types"

interface BusinessWarningsContextType {
  warnings: DashboardWarning[]
  warningCount: number
  hasWarning: (type: WarningType) => boolean
  getWarningsForPage: (page: "dashboard" | "promotions" | "locations" | "settings") => DashboardWarning[]
  highestPriorityWarning: DashboardWarning | null
  isLoading: boolean
  refresh: () => Promise<void>
  // Shared data for pages that need it
  business: BusinessProfile | null
  promotions: Promotion[]
  locations: BusinessLocation[]
  // Onboarding progress
  onboardingProgress: OnboardingProgress
}

const BusinessWarningsContext = createContext<BusinessWarningsContextType | undefined>(undefined)

export function BusinessWarningsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const businessUser = user as any
  const businessId = businessUser?.businessId

  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [locations, setLocations] = useState<BusinessLocation[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)

  // Fetch business data
  const fetchData = async () => {
    if (!businessId) {
      setIsDataLoading(false)
      return
    }

    setIsDataLoading(true)
    try {
      const [fetchedBusiness, fetchedPromotions, fetchedLocations] = await Promise.all([
        BusinessService.getBusiness(businessId),
        PromotionService.getPromotions({ businessId }),
        LocationService.getBusinessLocations(businessId),
      ])

      setBusiness(fetchedBusiness)
      setPromotions(fetchedPromotions)
      setLocations(fetchedLocations)
    } catch (error) {
      console.error("Error fetching business data for warnings:", error)
    } finally {
      setIsDataLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [businessId])

  // Use the warnings hook with fetched data
  const {
    warnings,
    warningCount,
    hasWarning,
    getWarningsForPage,
    highestPriorityWarning,
    isLoading: isWarningsLoading,
  } = useBusinessWarnings({
    business,
    promotions,
    locations,
  })

  // Use the onboarding progress hook
  const onboardingProgress = useOnboardingProgress({
    business,
    promotions,
    locations,
  })

  // Auto-activate business when onboarding is complete (only for pending businesses)
  // Track if we've already activated to prevent duplicate API calls
  const isActivatingRef = useRef(false)
  const lastActivatedBusinessIdRef = useRef<string | null>(null)

  useEffect(() => {
    async function checkAndActivate() {
      // Guards
      if (!businessId || !business || isDataLoading) return
      if (isActivatingRef.current) return

      // Only attempt activation for pending businesses
      if (business.status !== "pending") return

      // Don't re-activate if we already activated this business
      if (lastActivatedBusinessIdRef.current === businessId) return

      // Use the computed onboarding progress instead of re-checking
      if (!onboardingProgress.isComplete) {
        console.log("[BusinessWarningsContext] Onboarding not complete yet:", {
          hasLocations: locations.length > 0,
          hasPromotions: promotions.length > 0,
          hasPhone: !!business.phone_number,
          hasImage: !!business.featured_image,
        })
        return
      }

      console.log("[BusinessWarningsContext] Onboarding complete! Activating business...")
      isActivatingRef.current = true

      try {
        const success = await BusinessService.updateBusinessStatus(
          businessId,
          "active",
          "Onboarding completado automaticamente"
        )

        if (success) {
          console.log("[BusinessWarningsContext] Business activated successfully!")
          lastActivatedBusinessIdRef.current = businessId
          // Refresh data to get updated status
          await fetchData()
        } else {
          console.error("[BusinessWarningsContext] Failed to activate business")
        }
      } catch (error) {
        console.error("[BusinessWarningsContext] Error activating business:", error)
      } finally {
        isActivatingRef.current = false
      }
    }

    checkAndActivate()
  }, [businessId, business, promotions, locations, isDataLoading, onboardingProgress.isComplete])

  const contextValue = useMemo(
    () => ({
      warnings,
      warningCount,
      hasWarning,
      getWarningsForPage,
      highestPriorityWarning,
      isLoading: isDataLoading || isWarningsLoading,
      refresh: fetchData,
      business,
      promotions,
      locations,
      onboardingProgress,
    }),
    [
      warnings,
      warningCount,
      hasWarning,
      getWarningsForPage,
      highestPriorityWarning,
      isDataLoading,
      isWarningsLoading,
      business,
      promotions,
      locations,
      onboardingProgress,
    ]
  )

  return (
    <BusinessWarningsContext.Provider value={contextValue}>
      {children}
    </BusinessWarningsContext.Provider>
  )
}

export function useBusinessWarningsContext() {
  const context = useContext(BusinessWarningsContext)
  if (context === undefined) {
    throw new Error("useBusinessWarningsContext must be used within a BusinessWarningsProvider")
  }
  return context
}
