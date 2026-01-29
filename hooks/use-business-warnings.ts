"use client"

import { useState, useEffect, useMemo } from "react"
import type { DashboardWarning, WarningType, BusinessProfile, Promotion, BusinessLocation } from "@/lib/types"

interface UseBusinessWarningsOptions {
  business: BusinessProfile | null
  promotions: Promotion[]
  locations: BusinessLocation[]
}

/**
 * Hook for computing business dashboard warnings
 * Warnings are calculated client-side based on business state
 */
export function useBusinessWarnings(options: UseBusinessWarningsOptions) {
  const { business, promotions, locations } = options
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const warnings = useMemo<DashboardWarning[]>(() => {
    if (!isClient || !business) return []

    const warningList: DashboardWarning[] = []
    const now = new Date()

    // Check for no locations (highest priority - 1)
    if (locations.length === 0) {
      warningList.push({
        id: "no_locations",
        type: "no_locations",
        title: "Sin ubicaciones",
        description: "Tu negocio no tiene ubicaciones configuradas. Agrega al menos una ubicación para que los usuarios puedan encontrarte.",
        href: "/business/dashboard/locations",
        priority: 1,
      })
    }

    // Check for no active promotions (priority 2)
    const activePromotions = promotions.filter((p) => {
      if (p.status !== "active") return false
      const expiredAt = p.expired_at
      if (expiredAt && typeof expiredAt === "object" && "seconds" in expiredAt) {
        return new Date((expiredAt as any).seconds * 1000) > now
      }
      return new Date(expiredAt) > now
    })

    if (activePromotions.length === 0 && promotions.length === 0) {
      warningList.push({
        id: "no_promotions",
        type: "no_promotions",
        title: "Sin promociones",
        description: "No tienes promociones activas. Crea tu primera promoción para atraer clientes.",
        href: "/business/dashboard/promotions",
        priority: 2,
      })
    }

    // Check for expired promotions that need attention (priority 3)
    const expiredPromotions = promotions.filter((p) => {
      if (p.status === "expired") return true
      const expiredAt = p.expired_at
      if (expiredAt && typeof expiredAt === "object" && "seconds" in expiredAt) {
        return new Date((expiredAt as any).seconds * 1000) <= now && p.status === "active"
      }
      return new Date(expiredAt) <= now && p.status === "active"
    })

    if (expiredPromotions.length > 0) {
      warningList.push({
        id: "expired_promotions",
        type: "expired_promotions",
        title: `${expiredPromotions.length} ${expiredPromotions.length === 1 ? "promoción expirada" : "promociones expiradas"}`,
        description: `Tienes ${expiredPromotions.length} ${expiredPromotions.length === 1 ? "promoción que ha expirado" : "promociones que han expirado"}. Renuévalas o crea nuevas para mantener tu visibilidad.`,
        href: "/business/dashboard/promotions",
        priority: 3,
      })
    }

    // Check for incomplete profile (priority 4)
    const missingFields: string[] = []

    if (!business.description || business.description.trim() === "") {
      missingFields.push("descripción")
    }
    if (!business.featured_image) {
      missingFields.push("imagen destacada")
    }
    if (!business.website && business.type !== "physical") {
      missingFields.push("sitio web")
    }
    if (!business.phone_number) {
      missingFields.push("teléfono")
    }

    if (missingFields.length > 0) {
      warningList.push({
        id: "incomplete_profile",
        type: "incomplete_profile",
        title: "Perfil incompleto",
        description: `Completa tu perfil agregando: ${missingFields.join(", ")}. Un perfil completo genera más confianza.`,
        href: "/business/dashboard/settings",
        priority: 4,
      })
    }

    // Sort by priority (lower number = higher priority)
    warningList.sort((a, b) => a.priority - b.priority)

    return warningList
  }, [isClient, business, promotions, locations])

  // Filter warnings by type for specific pages
  const getWarningsForPage = (page: "dashboard" | "promotions" | "locations" | "settings"): DashboardWarning[] => {
    const pageWarningTypes: Record<string, WarningType[]> = {
      dashboard: ["no_promotions", "expired_promotions", "no_locations", "incomplete_profile"],
      promotions: ["no_promotions", "expired_promotions"],
      locations: ["no_locations"],
      settings: ["incomplete_profile"],
    }

    const allowedTypes = pageWarningTypes[page] || []
    return warnings.filter((w) => allowedTypes.includes(w.type))
  }

  // Get warning count for notification bell
  const warningCount = warnings.length

  // Check if a specific warning type exists
  const hasWarning = (type: WarningType): boolean => {
    return warnings.some((w) => w.type === type)
  }

  // Get the highest priority warning (for notification bell redirect)
  const highestPriorityWarning = warnings.length > 0 ? warnings[0] : null

  return {
    warnings,
    warningCount,
    hasWarning,
    getWarningsForPage,
    highestPriorityWarning,
    isLoading: !isClient,
  }
}

/**
 * Get warning type display configuration
 */
export function getWarningConfig(type: WarningType): {
  icon: string
  color: "yellow" | "orange" | "red"
  iconColor: string
  bgColor: string
  borderColor: string
} {
  const configs: Record<WarningType, {
    icon: string
    color: "yellow" | "orange" | "red"
    iconColor: string
    bgColor: string
    borderColor: string
  }> = {
    no_locations: {
      icon: "map-pin",
      color: "red",
      iconColor: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    no_promotions: {
      icon: "tag",
      color: "orange",
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    expired_promotions: {
      icon: "clock",
      color: "yellow",
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    incomplete_profile: {
      icon: "user",
      color: "yellow",
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
  }

  return configs[type]
}
