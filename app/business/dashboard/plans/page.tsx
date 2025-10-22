"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Check,
  Crown,
  Shield,
  Zap,
  TrendingUp,
  MapPin,
  Users,
  BarChart3,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import {
  getCurrentPricing,
  isEarlyBirdActive,
  calculateEarlyBirdPrice,
  isTrialOfferActive,
  formatPrice
} from "@/lib/pricing-config"
import { getPlanLimits, PLAN_LIMITS } from "@/lib/plan-limits"
import { cn } from "@/lib/utils"
import type { PlanType, BillingPeriod } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"

const PLAN_FEATURES = {
  gratis: {
    icon: Zap,
    name: "Gratis",
    tagline: "Ideal para comenzar",
    color: "text-gray-600",
    features: [
      "1 ubicación",
      "Promociones ilimitadas (pago por promoción)",
      "1 usuario",
      "Analíticas básicas",
      "Soporte por email",
    ],
    limitations: [
      "Sin analíticas avanzadas",
      "Sin equipo colaborativo",
      "Sin análisis por ubicación",
    ],
  },
  basico: {
    icon: Shield,
    name: "Básico",
    tagline: "Para negocios en crecimiento",
    color: "text-blue-600",
    popular: false,
    features: [
      "Hasta 3 ubicaciones",
      "3 promociones activas por negocio",
      "2 usuarios del equipo",
      "Analíticas básicas",
      "Soporte prioritario",
    ],
    extraPromotions: true,
  },
  pro: {
    icon: Crown,
    name: "Pro",
    tagline: "Para profesionales",
    color: "text-primary",
    popular: true,
    features: [
      "Hasta 10 ubicaciones",
      "10 promociones activas",
      "5 usuarios del equipo",
      "Analíticas avanzadas",
      "Análisis por ubicación",
      "Demografía de usuarios",
      "Ingresos atribuidos",
      "Soporte prioritario 24/7",
    ],
  },
  enterprise: {
    icon: TrendingUp,
    name: "Enterprise",
    tagline: "Para empresas grandes",
    color: "text-secondary",
    features: [
      "Ubicaciones ilimitadas",
      "Promociones ilimitadas",
      "10 usuarios del equipo",
      "Analíticas enterprise",
      "Mapas de calor",
      "Análisis de cohortes",
      "Benchmarking industria",
      "Gerente de cuenta dedicado",
      "Soporte 24/7 premium",
    ],
  },
}

export default function PlansPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual")
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)

  const businessUser = user as any
  const currentPlan: PlanType = businessUser?.plan || "gratis"

  // Get query params for suggested plan
  const fromPlan = searchParams.get("from") as PlanType | null
  const targetPlan = searchParams.get("target") as PlanType | null
  const feature = searchParams.get("feature")

  // Pricing info
  const pricing = getCurrentPricing()
  const earlyBirdActive = isEarlyBirdActive()
  const trialAvailable = isTrialOfferActive()
  const trialOffer = pricing.trialOffer

  useEffect(() => {
    if (targetPlan) {
      setSelectedPlan(targetPlan)
    }
  }, [targetPlan])

  const getPlanPrice = (plan: PlanType, period: BillingPeriod) => {
    if (plan === "gratis") return 0

    const planKey = plan as "basico" | "pro" | "enterprise"
    const basePrice = pricing.regularPlans[planKey][period]

    if (earlyBirdActive && period === "monthly") {
      return calculateEarlyBirdPrice(planKey, period)
    }

    return basePrice
  }

  const calculateSavings = (plan: PlanType) => {
    if (plan === "gratis") return 0

    const planKey = plan as "basico" | "pro" | "enterprise"
    const monthlyTotal = pricing.regularPlans[planKey].monthly * 12
    const annualPrice = pricing.regularPlans[planKey].annual

    return monthlyTotal - annualPrice
  }

  const handleSelectPlan = (plan: PlanType) => {
    if (plan === currentPlan) return

    setSelectedPlan(plan)

    // TODO: Navigate to payment/checkout
    console.log(`Selected plan: ${plan}, billing: ${billingPeriod}`)
  }

  const getPlanOrder = (plan: PlanType): number => {
    const order = { gratis: 0, basico: 1, pro: 2, enterprise: 3 }
    return order[plan]
  }

  const canUpgrade = (plan: PlanType): boolean => {
    return getPlanOrder(plan) > getPlanOrder(currentPlan)
  }

  const canDowngrade = (plan: PlanType): boolean => {
    return getPlanOrder(plan) < getPlanOrder(currentPlan)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Elige el Plan Perfecto para tu Negocio</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Comienza con nuestro plan gratuito y actualiza cuando estés listo
        </p>

        {/* Feature context banner */}
        {feature && (
          <Card className="border-primary/20 bg-primary/5 max-w-2xl mx-auto">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <p className="text-sm">
                  Actualiza tu plan para desbloquear <strong>{feature}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Trial Offer Banner */}
      {trialAvailable && trialOffer && (
        <Card className="border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-500 p-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900">
                  {trialOffer.badge}
                </h3>
                <p className="text-blue-700 mt-1">
                  {trialOffer.description} - Válido hasta {trialOffer.nextBillingDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <Button className="mt-3" onClick={() => handleSelectPlan("enterprise")}>
                  Activar Oferta por {formatPrice(trialOffer.price)}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Early Bird Banner */}
      {earlyBirdActive && (
        <Card className="border-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-yellow-500 p-3">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-yellow-900">
                  🎊 Early Bird - 50% de Descuento
                </h3>
                <p className="text-yellow-700 mt-1">
                  ¡Aprovecha nuestro descuento de lanzamiento! Válido hasta el 15 de enero de 2026.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-4">
        <Label htmlFor="billing-toggle" className={billingPeriod === "monthly" ? "font-semibold" : ""}>
          Mensual
        </Label>
        <Switch
          id="billing-toggle"
          checked={billingPeriod === "annual"}
          onCheckedChange={(checked) => setBillingPeriod(checked ? "annual" : "monthly")}
        />
        <Label htmlFor="billing-toggle" className={billingPeriod === "annual" ? "font-semibold" : ""}>
          Anual
        </Label>
        {billingPeriod === "annual" && (
          <Badge variant="default" className="ml-2">
            Ahorra hasta 20%
          </Badge>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(PLAN_FEATURES) as PlanType[]).map((plan) => {
          const config = PLAN_FEATURES[plan]
          const Icon = config.icon
          const price = getPlanPrice(plan, billingPeriod)
          const limits = getPlanLimits(plan)
          const isCurrentPlan = plan === currentPlan
          const isPopular = config.popular
          const savings = billingPeriod === "annual" ? calculateSavings(plan) : 0

          return (
            <Card
              key={plan}
              className={cn(
                "relative",
                isCurrentPlan && "border-primary shadow-lg",
                isPopular && !isCurrentPlan && "border-primary/50",
                selectedPlan === plan && "ring-2 ring-primary"
              )}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Más Popular</Badge>
                </div>
              )}

              {isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge variant="outline" className="bg-background">
                    Plan Actual
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("h-6 w-6", config.color)} />
                  <CardTitle className="text-xl">{config.name}</CardTitle>
                </div>
                <CardDescription>{config.tagline}</CardDescription>

                <div className="mt-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">
                      {plan === "gratis" ? "" : billingPeriod === "monthly" ? "/mes" : "/año"}
                    </span>
                  </div>
                  {earlyBirdActive && billingPeriod === "monthly" && plan !== "gratis" && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        50% OFF - Precio regular: ${getPlanPrice(plan, billingPeriod) * 2}
                      </Badge>
                    </div>
                  )}
                  {savings > 0 && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Ahorras ${savings.toLocaleString()} COP al año
                      </Badge>
                    </div>
                  )}
                  {plan === "gratis" && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      $11,900 COP por promoción activa
                    </p>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Key Limits */}
                <div className="space-y-2 pb-4 border-b">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ubicaciones</span>
                    <span className="font-medium">
                      {limits.maxLocations === Infinity ? "Ilimitadas" : limits.maxLocations}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Promociones activas</span>
                    <span className="font-medium">
                      {limits.maxActivePromotions === null
                        ? "Pay-per-use"
                        : limits.maxActivePromotions === Infinity
                          ? "Ilimitadas"
                          : limits.maxActivePromotions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Usuarios</span>
                    <span className="font-medium">
                      {limits.maxUsers === Infinity ? "Ilimitados" : limits.maxUsers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Analíticas</span>
                    <span className="font-medium capitalize">{limits.analyticsLevel}</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-2">
                  {config.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {config.limitations && (
                  <ul className="space-y-2 pt-2 border-t">
                    {config.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {config.extraPromotions && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      + Compra promociones adicionales por $11,900 COP c/u
                    </p>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plan Actual
                  </Button>
                ) : canUpgrade(plan) ? (
                  <Button
                    className="w-full"
                    onClick={() => handleSelectPlan(plan)}
                    variant={isPopular ? "default" : "outline"}
                  >
                    {plan === "gratis" ? "Comenzar Gratis" : "Actualizar Plan"}
                  </Button>
                ) : canDowngrade(plan) ? (
                  <Button variant="outline" className="w-full" onClick={() => handleSelectPlan(plan)}>
                    Cambiar a {config.name}
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comparación Detallada de Planes</CardTitle>
          <CardDescription>Todas las funcionalidades en detalle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Funcionalidad</th>
                  {(Object.keys(PLAN_FEATURES) as PlanType[]).map((plan) => (
                    <th key={plan} className="text-center p-4 font-medium">
                      {PLAN_FEATURES[plan].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">Ubicaciones</td>
                  {(Object.keys(PLAN_LIMITS) as PlanType[]).map((plan) => (
                    <td key={plan} className="text-center p-4">
                      {PLAN_LIMITS[plan].maxLocations === Infinity ? "∞" : PLAN_LIMITS[plan].maxLocations}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4">Promociones activas</td>
                  {(Object.keys(PLAN_LIMITS) as PlanType[]).map((plan) => (
                    <td key={plan} className="text-center p-4">
                      {PLAN_LIMITS[plan].maxActivePromotions === null
                        ? "Pay"
                        : PLAN_LIMITS[plan].maxActivePromotions === Infinity
                          ? "∞"
                          : PLAN_LIMITS[plan].maxActivePromotions}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4">Miembros del equipo</td>
                  {(Object.keys(PLAN_LIMITS) as PlanType[]).map((plan) => (
                    <td key={plan} className="text-center p-4">
                      {PLAN_LIMITS[plan].maxUsers === Infinity ? "∞" : PLAN_LIMITS[plan].maxUsers}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4">Analíticas básicas</td>
                  {(Object.keys(PLAN_LIMITS) as PlanType[]).map((plan) => (
                    <td key={plan} className="text-center p-4">
                      <Check className="h-5 w-5 text-primary mx-auto" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4">Analíticas avanzadas</td>
                  {(Object.keys(PLAN_LIMITS) as PlanType[]).map((plan) => (
                    <td key={plan} className="text-center p-4">
                      {PLAN_LIMITS[plan].analyticsLevel === "advanced" || PLAN_LIMITS[plan].analyticsLevel === "enterprise" ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4">Análisis por ubicación</td>
                  {(Object.keys(PLAN_LIMITS) as PlanType[]).map((plan) => (
                    <td key={plan} className="text-center p-4">
                      {PLAN_LIMITS[plan].perLocationAnalytics ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="p-4">Analíticas enterprise</td>
                  {(Object.keys(PLAN_LIMITS) as PlanType[]).map((plan) => (
                    <td key={plan} className="text-center p-4">
                      {PLAN_LIMITS[plan].analyticsLevel === "enterprise" ? (
                        <Check className="h-5 w-5 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ or Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>¿Tienes preguntas?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">¿Puedo cambiar de plan en cualquier momento?</h4>
            <p className="text-sm text-muted-foreground">
              Sí, puedes actualizar o cambiar tu plan en cualquier momento. Los cambios se aplicarán de inmediato.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">¿Qué sucede si excedo los límites de mi plan?</h4>
            <p className="text-sm text-muted-foreground">
              Te notificaremos cuando te acerques a los límites. Puedes comprar promociones adicionales o actualizar tu plan.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">¿Puedo cancelar en cualquier momento?</h4>
            <p className="text-sm text-muted-foreground">
              Sí, puedes cancelar tu suscripción en cualquier momento sin penalización. Tu plan permanecerá activo hasta el final del período de facturación.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
