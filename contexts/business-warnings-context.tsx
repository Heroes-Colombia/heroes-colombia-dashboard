"use client"

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import { useBusinessWarnings } from "@/hooks/use-business-warnings"
import { PromotionService } from "@/lib/services/promotion-service"
import { LocationService } from "@/lib/services/location-service"
import { BusinessService } from "@/lib/services/business-service"
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
