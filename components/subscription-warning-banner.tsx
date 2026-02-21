"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { X, AlertTriangle, Clock, CreditCard, Crown, Sparkles } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTrialWarning, useSubscription } from "@/hooks/use-subscription"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

interface SubscriptionWarningBannerProps {
  /**
   * Allow the banner to be dismissed for this session
   */
  dismissible?: boolean
  /**
   * Compact mode for smaller displays
   */
  compact?: boolean
}

// Pages that require active subscription (canCreateContent = true)
const RESTRICTED_PATHS = [
  "/business/dashboard/promotions",
  "/business/dashboard/analytics",
  "/business/dashboard/locations",
  "/business/dashboard/team",
  "/business/dashboard/plans",
]

/**
 * Warning banner shown when:
 * - Trial is about to expire (within 14 days)
 * - Payment is pending (just registered, didn't complete payment)
 */
export function SubscriptionWarningBanner({
  dismissible = true,
  compact = false,
}: SubscriptionWarningBannerProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const businessId = (user as any)?.businessId || null
  const { subscription, isFounder, isPendingPayment, isLoading } = useSubscription({ businessId })
  const { showWarning, warningLevel, daysRemaining, message } = useTrialWarning(businessId)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check localStorage for dismissed state on mount
  useEffect(() => {
    if (!mounted) return
    const dismissedKey = `subscription_banner_dismissed_${businessId}`
    const dismissedUntil = localStorage.getItem(dismissedKey)
    if (dismissedUntil) {
      const expiry = new Date(dismissedUntil)
      if (expiry > new Date()) {
        setDismissed(true)
      } else {
        localStorage.removeItem(dismissedKey)
      }
    }
  }, [mounted, businessId])

  // Don't render while loading or not mounted
  if (!mounted || isLoading) {
    return null
  }

  // Check if current path is restricted
  const isRestrictedPath = RESTRICTED_PATHS.some(path => pathname === path || pathname?.startsWith(path + "/"))
  if (isRestrictedPath) {
    return null
  }

  // If dismissed, don't show
  if (dismissed) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Dismiss for 24 hours
    const dismissedKey = `subscription_banner_dismissed_${businessId}`
    const expiry = new Date()
    expiry.setHours(expiry.getHours() + 24)
    localStorage.setItem(dismissedKey, expiry.toISOString())
  }

  // Pending payment state
  if (isPendingPayment) {
    return (
      <Alert
        className={cn(
          "border-amber-500 bg-amber-50 dark:bg-amber-950/20",
          compact ? "py-2" : "py-4"
        )}
      >
        <CreditCard className="h-5 w-5 text-amber-600" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">
          Completa tu pago para activar tu prueba
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          <div className={cn("flex flex-col sm:flex-row sm:items-center gap-3", compact ? "mt-1" : "mt-2")}>
            <p className="flex-1 text-sm">
              Tu registro esta casi listo. Completa el pago de <strong>$20,000 COP</strong> para activar tu periodo de prueba de 2 meses.
            </p>
            <Button asChild variant="default" size={compact ? "sm" : "default"} className="bg-amber-600 hover:bg-amber-700">
              <Link href="/business/dashboard/plans">
                Completar Pago
              </Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Trial warning states
  if (!showWarning || warningLevel === "none") {
    return null
  }

  // Variant styles based on warning level
  const variants = {
    info: {
      border: "border-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/20",
      icon: <Clock className="h-5 w-5 text-blue-600" />,
      titleColor: "text-blue-800 dark:text-blue-200",
      textColor: "text-blue-700 dark:text-blue-300",
      buttonVariant: "outline" as const,
    },
    warning: {
      border: "border-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/20",
      icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
      titleColor: "text-amber-800 dark:text-amber-200",
      textColor: "text-amber-700 dark:text-amber-300",
      buttonVariant: "default" as const,
    },
    critical: {
      border: "border-red-500",
      bg: "bg-red-50 dark:bg-red-950/20",
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      titleColor: "text-red-800 dark:text-red-200",
      textColor: "text-red-700 dark:text-red-300",
      buttonVariant: "destructive" as const,
    },
    expired: {
      border: "border-red-500",
      bg: "bg-red-50 dark:bg-red-950/20",
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
      titleColor: "text-red-800 dark:text-red-200",
      textColor: "text-red-700 dark:text-red-300",
      buttonVariant: "destructive" as const,
    },
  }

  const variant = variants[warningLevel]

  // Format end date
  const endDate = subscription?.end_date
    ? new Date(
      subscription.end_date instanceof Date
        ? subscription.end_date
        : (subscription.end_date as any).toDate?.()
          ? (subscription.end_date as any).toDate()
          : subscription.end_date
    ).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    : null

  return (
    <Alert
      className={cn(
        variant.border,
        variant.bg,
        "relative",
        compact ? "py-2" : "py-4"
      )}
    >
      {variant.icon}
      <AlertTitle className={variant.titleColor}>
        {warningLevel === "expired" ? "Tu suscripción ha expirado" : message}
      </AlertTitle>
      <AlertDescription className={variant.textColor}>
        <div className={cn("flex flex-col sm:flex-row sm:items-center gap-3", compact ? "mt-1" : "mt-2")}>
          <div className="flex-1 text-sm space-y-1">
            <p>
              {warningLevel === "expired" ? (
                <>
                  Tus promociones ya no son visibles en la app. Renueva ahora para volver a aparecer.
                </>
              ) : warningLevel === "critical" ? (
                <>
                  Despues del <strong>{endDate}</strong>, tus promociones no serán visibles en la app.
                </>
              ) : (
                <>
                  Tu periodo de prueba vence el <strong>{endDate}</strong>. Asegura tu lugar {isFounder ? "como Fundador" : "en Heroes Colombia"}.
                </>
              )}
            </p>
            {(warningLevel === "critical" || warningLevel === "expired") && (
              <p className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {isFounder ? "Asegura tu lugar como Fundador!" : "No pierdas esta oportunidad!"}
              </p>
            )}
          </div>
          <Button
            asChild
            variant={variant.buttonVariant}
            size={compact ? "sm" : "default"}
            className={cn(
              warningLevel === "warning" && "bg-amber-600 hover:bg-amber-700",
              "whitespace-nowrap"
            )}
          >
            <Link href="/business/dashboard/plans">
              <Crown className="w-4 h-4 mr-1.5" />
              {isFounder ? "Ver Plan Fundador" : "Ver Planes"}
            </Link>
          </Button>
        </div>
      </AlertDescription>

      {/* Dismiss button */}
      {dismissible && warningLevel !== "critical" && warningLevel !== "expired" && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6 opacity-60 hover:opacity-100"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </Button>
      )}
    </Alert>
  )
}
