"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Ban, Crown, Sparkles, CreditCard, Lock } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSubscription } from "@/hooks/use-subscription"
import { useAuth } from "@/hooks/use-auth"

interface SubscriptionExpiredOverlayProps {
  /**
   * Number of remaining founder spots (optional, for display)
   */
  remainingFounderSpots?: number
}

// Pages that should be accessible regardless of subscription status
const ACCESSIBLE_PATHS = [
  "/business/dashboard",
  "/business/dashboard/plans",
  "/business/dashboard/settings",
]

// Pages that require active subscription (canCreateContent = true)
const RESTRICTED_PATHS = [
  "/business/dashboard/promotions",
  "/business/dashboard/analytics",
  "/business/dashboard/locations",
  "/business/dashboard/team",
]

/**
 * Content-level blur overlay shown when subscription doesn't allow content creation.
 * Covers only the main content area, allowing navigation to remain accessible.
 * Shows different messages for pending_payment vs expired states.
 */
export function SubscriptionExpiredOverlay({
  remainingFounderSpots = 40,
}: SubscriptionExpiredOverlayProps) {
  const { user } = useAuth()
  const pathname = usePathname()
  const businessId = (user as any)?.businessId || null
  const { canCreateContent, isPendingPayment, isLoading } = useSubscription({ businessId })
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render anything while loading or not mounted
  if (!mounted || isLoading) {
    return null
  }

  // Check if current path is accessible (no overlay needed)
  const isAccessiblePath = ACCESSIBLE_PATHS.some(path => pathname === path)
  if (isAccessiblePath) {
    return null
  }

  // Check if current path is restricted
  const isRestrictedPath = RESTRICTED_PATHS.some(path => pathname === path || pathname?.startsWith(path + "/"))
  if (!isRestrictedPath) {
    return null
  }

  // Only show overlay if user cannot create content
  if (canCreateContent) {
    return null
  }

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center">
      {/* Blur backdrop - covers only the content area */}
      <div
        className="absolute inset-0 bg-background/1 backdrop-blur-md rounded"
        aria-hidden="true"
      />

      {/* Modal content */}
      <Card className="relative z-10 w-full max-w-lg mx-4 shadow-2xl border-2">
        {isPendingPayment ? (
          // Pending Payment State - User registered but hasn't paid trial
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-2xl">Completa tu pago para acceder</CardTitle>
              <CardDescription className="text-base mt-2">
                Para acceder a esta seccion, necesitas completar el pago de tu periodo de prueba.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Trial benefits */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Tu periodo de prueba incluye:
                </h3>
                <ul className="text-sm space-y-1.5 text-blue-700 dark:text-blue-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    2 meses de acceso completo
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Todas las funcionalidades Enterprise
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Tu negocio visible en la app
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    Soporte directo con el equipo
                  </li>
                </ul>
              </div>

              {/* CTA buttons */}
              <div className="space-y-3 pt-2">
                <Button asChild className="w-full h-12 text-base" size="lg">
                  <Link href="/business/dashboard/plans">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Completar Pago - $20,000 COP
                  </Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Tienes preguntas?{" "}
                  <a
                    href="https://wa.me/573115157814"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Contactanos por WhatsApp
                  </a>
                </p>
              </div>
            </CardContent>
          </>
        ) : (
          // Expired State - Trial ended, need to become Founder
          <>
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Ban className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Tu periodo de prueba ha expirado</CardTitle>
              <CardDescription className="text-base mt-2">
                Tu negocio ya no es visible en la app de Heroes Colombia y no puedes gestionar tus promociones.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Founder CTA */}
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0">
                    <Crown className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                      Conviertete en Fundador
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Asegura tu precio exclusivo de <span className="font-bold">$480,000 COP/año</span> por ser de los primeros en unirte.
                    </p>
                    {remainingFounderSpots <= 100 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Solo quedan {remainingFounderSpots} lugares de 100
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Benefits list */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Como Fundador tendras:</p>
                <ul className="text-sm space-y-1.5 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Precio de fundador por siempre
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Acceso a todas las funcionalidades Enterprise
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Soporte prioritario directo con el equipo
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    Tu negocio visible en la app para miles de usuarios
                  </li>
                </ul>
              </div>

              {/* CTA buttons */}
              <div className="space-y-3 pt-2">
                <Button asChild className="w-full h-12 text-base" size="lg">
                  <Link href="/business/dashboard/plans">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Activar Plan Fundador - $480,000/año
                  </Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Tienes preguntas?{" "}
                  <a
                    href="https://wa.me/573115157814"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Contactanos por WhatsApp
                  </a>
                </p>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
