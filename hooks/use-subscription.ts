"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  SubscriptionService,
  SubscriptionInfo,
} from "@/lib/services/subscription-service"
import type { BusinessSubscription, SubscriptionStatus } from "@/lib/types"

interface UseSubscriptionOptions {
  /**
   * Business ID to fetch subscription for
   */
  businessId: string | null
  /**
   * Whether to auto-refresh subscription data periodically
   * Useful for detecting trial expiration in real-time
   */
  autoRefresh?: boolean
  /**
   * Interval in milliseconds for auto-refresh (default: 60000 = 1 minute)
   */
  refreshInterval?: number
}

interface UseSubscriptionReturn {
  // Core data
  subscription: BusinessSubscription | null
  subscriptionInfo: SubscriptionInfo | null

  // Computed status flags
  isLoading: boolean
  error: string | null
  isActive: boolean
  isTrialExpired: boolean
  isFounder: boolean
  isPendingPayment: boolean
  canCreateContent: boolean

  // Computed values
  daysUntilExpiration: number | null
  statusLabel: string
  planLabel: string

  // Actions
  refreshSubscription: () => Promise<void>
}

/**
 * Hook for accessing subscription data and status for a business
 */
export function useSubscription(options: UseSubscriptionOptions): UseSubscriptionReturn {
  const { businessId, autoRefresh = false, refreshInterval = 60000 } = options

  const [subscription, setSubscription] = useState<BusinessSubscription | null>(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Mark as client-side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fetch subscription data
  const fetchSubscription = useCallback(async () => {
    if (!businessId) {
      setSubscription(null)
      setSubscriptionInfo(null)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const info = await SubscriptionService.getSubscriptionInfo(businessId)
      setSubscription(info.subscription)
      setSubscriptionInfo(info)
    } catch (err) {
      console.error("[useSubscription] Error fetching subscription:", err)
      setError("Failed to load subscription data")
      setSubscription(null)
      setSubscriptionInfo(null)
    } finally {
      setIsLoading(false)
    }
  }, [businessId])

  // Initial fetch
  useEffect(() => {
    if (!isClient || !businessId) return
    fetchSubscription()
  }, [isClient, businessId, fetchSubscription])

  // Auto-refresh (optional)
  useEffect(() => {
    if (!isClient || !businessId || !autoRefresh) return

    const intervalId = setInterval(fetchSubscription, refreshInterval)
    return () => clearInterval(intervalId)
  }, [isClient, businessId, autoRefresh, refreshInterval, fetchSubscription])

  // Computed values
  const isActive = subscriptionInfo?.isActive ?? false
  const isTrialExpired = subscriptionInfo?.isTrialExpired ?? false
  const isFounder = subscriptionInfo?.isFounder ?? false
  const isPendingPayment = subscriptionInfo?.isPendingPayment ?? false
  const canCreateContent = subscriptionInfo?.canCreateContent ?? false
  const daysUntilExpiration = subscriptionInfo?.daysUntilExpiration ?? null

  // Status label for UI
  const statusLabel = useMemo(() => {
    if (!subscription) return "Sin suscripción"

    const labels: Record<SubscriptionStatus, string> = {
      pending_payment: "Pago pendiente",
      trial: "Período de prueba",
      active: "Activa",
      past_due: "Pago vencido",
      cancelled: "Cancelada",
      expired: "Expirada",
    }

    return labels[subscription.status] || subscription.status
  }, [subscription])

  // Plan label for UI
  const planLabel = useMemo(() => {
    if (!subscription) return "Sin plan"

    const labels: Record<string, string> = {
      trial: "Trial",
      fundador: "Fundador",
      basico: "Básico",
      pro: "Pro",
      enterprise: "Enterprise",
    }

    return labels[subscription.plan] || subscription.plan
  }, [subscription])

  return {
    subscription,
    subscriptionInfo,
    isLoading,
    error,
    isActive,
    isTrialExpired,
    isFounder,
    isPendingPayment,
    canCreateContent,
    daysUntilExpiration,
    statusLabel,
    planLabel,
    refreshSubscription: fetchSubscription,
  }
}

/**
 * Hook for checking if the current user can perform subscription-gated actions
 * Useful for disabling buttons/features when subscription is expired or pending
 */
export function useCanCreateContent(businessId: string | null): {
  canCreate: boolean
  reason: string | null
  isLoading: boolean
} {
  const { canCreateContent, isPendingPayment, isTrialExpired, isLoading } = useSubscription({
    businessId,
  })

  const reason = useMemo(() => {
    if (isPendingPayment) {
      return "Completa el pago de tu prueba para crear contenido"
    }
    if (isTrialExpired) {
      return "Tu período de prueba ha expirado. Activa tu suscripción para continuar"
    }
    if (!canCreateContent) {
      return "Tu suscripción no permite crear contenido en este momento"
    }
    return null
  }, [isPendingPayment, isTrialExpired, canCreateContent])

  return {
    canCreate: canCreateContent,
    reason,
    isLoading,
  }
}

/**
 * Hook specifically for trial expiration warnings
 * Returns warning levels based on days until expiration
 */
export function useTrialWarning(businessId: string | null): {
  showWarning: boolean
  warningLevel: "none" | "info" | "warning" | "critical" | "expired"
  daysRemaining: number | null
  message: string | null
  isLoading: boolean
} {
  const { subscription, daysUntilExpiration, isTrialExpired, isLoading } = useSubscription({
    businessId,
  })

  const result = useMemo(() => {
    // Only show warnings for trial subscriptions
    if (!subscription || subscription.type !== "trial") {
      return {
        showWarning: false,
        warningLevel: "none" as const,
        daysRemaining: null,
        message: null,
      }
    }

    if (isTrialExpired) {
      return {
        showWarning: true,
        warningLevel: "expired" as const,
        daysRemaining: 0,
        message: "Tu período de prueba ha expirado",
      }
    }

    if (daysUntilExpiration === null) {
      return {
        showWarning: false,
        warningLevel: "none" as const,
        daysRemaining: null,
        message: null,
      }
    }

    if (daysUntilExpiration <= 0) {
      return {
        showWarning: true,
        warningLevel: "expired" as const,
        daysRemaining: 0,
        message: "Tu período de prueba ha expirado",
      }
    }

    if (daysUntilExpiration <= 3) {
      return {
        showWarning: true,
        warningLevel: "critical" as const,
        daysRemaining: daysUntilExpiration,
        message: `Tu período de prueba vence en ${daysUntilExpiration} día${daysUntilExpiration === 1 ? "" : "s"}`,
      }
    }

    if (daysUntilExpiration <= 7) {
      return {
        showWarning: true,
        warningLevel: "warning" as const,
        daysRemaining: daysUntilExpiration,
        message: `Tu período de prueba vence en ${daysUntilExpiration} días`,
      }
    }

    if (daysUntilExpiration <= 14) {
      return {
        showWarning: true,
        warningLevel: "info" as const,
        daysRemaining: daysUntilExpiration,
        message: `Tu período de prueba vence en ${daysUntilExpiration} días`,
      }
    }

    return {
      showWarning: false,
      warningLevel: "none" as const,
      daysRemaining: daysUntilExpiration,
      message: null,
    }
  }, [subscription, daysUntilExpiration, isTrialExpired])

  return {
    ...result,
    isLoading,
  }
}
