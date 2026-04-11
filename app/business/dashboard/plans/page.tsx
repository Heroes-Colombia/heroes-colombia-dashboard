"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
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
  Sparkles,
  AlertCircle,
  Play,
  Rocket,
  Star,
  CreditCard,
  Calendar,
  Clock,
} from "lucide-react"
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
import { useSubscription } from "@/hooks/use-subscription"

const PLAN_FEATURES = {
  fundador: {
    icon: Star,
    name: "Fundador",
    tagline: "Plan exclusivo para fundadores",
    color: "text-amber-600",
    popular: false,
    features: [
      "Ubicaciones ilimitadas",
      "Promociones ilimitadas",
      "10 usuarios del equipo",
      "Analíticas enterprise",
      "Mapas de calor",
      "Análisis de cohortes",
      "Benchmarking industria",
      "Soporte personalizado por email o WhatsApp",
    ],
  },
  basico: {
    icon: Shield,
    name: "Básico",
    tagline: "Para pequeños negocios",
    color: "text-blue-600",
    popular: false,
    features: [
      "Hasta 1 ubicaciones",
      "2 promociones activas por negocio",
      "1 usuarios del equipo",
      "Analíticas básicas",
      "Soporte por email",
    ],
    extraPromotions: true,
  },
  pro: {
    icon: Crown,
    name: "Pro",
    tagline: "Para negocios en crecimiento",
    color: "text-primary",
    popular: true,
    features: [
      "Hasta 5 ubicaciones",
      "5 promociones activas",
      "3 usuarios del equipo",
      "Analíticas avanzadas",
      "Análisis por ubicación",
      "Demografía de usuarios",
      "Ingresos atribuidos",
      "Soporte prioritario",
    ],
  },
  enterprise: {
    icon: TrendingUp,
    name: "Enterprise",
    tagline: "Para empresas grandes",
    color: "text-secondary",
    popular: false,
    features: [
      "Ubicaciones ilimitadas",
      "Promociones ilimitadas",
      "10 usuarios del equipo",
      "Analíticas enterprise",
      "Mapas de calor",
      "Análisis de cohortes",
      "Benchmarking industria",
      "Soporte personalizado por email o WhatsApp",
    ],
  },
}

export default function PlansPage() {
  const { user } = useAuth()
  const businessId = (user as any)?.businessId || null
  const searchParams = useSearchParams()
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual")
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)

  const businessUser = user as any
  const { isFounder, isTrialExpired, isPendingPayment, subscription, daysUntilExpiration, isActive } = useSubscription({ businessId })
  const currentPlan: PlanType = businessUser?.plan || "basico"
  const [isTrialLoading, setIsTrialLoading] = useState(false)
  const [trialError, setTrialError] = useState<string | null>(null)

  // Determine which plans to show:
  // - Founders always see only the Fundador card (already paid)
  // - Expired trial users see only the Fundador card (natural next step, mirrors CTA on overlay)
  // - Everyone else sees the three regular plans
  const showFoundadorOnly = isFounder || isTrialExpired
  const visiblePlans: PlanType[] = showFoundadorOnly
    ? ["fundador"]
    : ["basico", "pro", "enterprise"]

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
    const planKey = plan as keyof typeof pricing.regularPlans
    const basePrice = pricing.regularPlans[planKey][period]

    // Early-bird only applies to regular plans, not fundador
    if (earlyBirdActive && period === "monthly" && plan !== "fundador") {
      return calculateEarlyBirdPrice(plan as "basico" | "pro" | "enterprise", period)
    }

    return basePrice
  }

  const calculateSavings = (plan: PlanType) => {
    const planKey = plan as keyof typeof pricing.regularPlans
    const monthlyTotal = pricing.regularPlans[planKey].monthly * 12
    const annualPrice = pricing.regularPlans[planKey].annual

    return monthlyTotal - annualPrice
  }

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectPlan = async (plan: PlanType) => {
    // if (plan === currentPlan) return

    setSelectedPlan(plan)
    setIsLoading(true)
    setError(null)

    try {
      // Get business info from the authenticated user
      const businessId = businessUser?.business_id || businessUser?.id
      const businessName = businessUser?.business_name || businessUser?.name || "Negocio"
      const email = businessUser?.email || ""
      const phone = businessUser?.phone_number || businessUser?.phone || ""

      if (!businessId || !email) {
        throw new Error("No se pudo obtener la información del negocio")
      }

      const response = await fetch("/api/mercadopago/setup-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          billingPeriod,
          email,
          businessName,
          businessId,
          phone,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al crear el checkout")
      }

      // Redirect to Mercado Pago checkout
      window.location.href = result.checkoutUrl
    } catch (error) {
      console.error("[Setup Plan] Error:", error)
      setError(error instanceof Error ? error.message : "Error al procesar la solicitud")
      setIsLoading(false)
    }
  }

  const getPlanOrder = (plan: PlanType): number => {
    const order = { basico: 1, pro: 2, enterprise: 3, fundador: 4 }
    return order[plan]
  }

  const canUpgrade = (plan: PlanType): boolean => {
    return getPlanOrder(plan) > getPlanOrder(currentPlan)
  }

  const canDowngrade = (plan: PlanType): boolean => {
    return getPlanOrder(plan) < getPlanOrder(currentPlan)
  }

  // Handle trial payment for pending_payment users
  const handleTrialPayment = async () => {
    setIsTrialLoading(true)
    setTrialError(null)

    try {
      const businessId = businessUser?.business_id || businessUser?.id
      const businessName = businessUser?.business_name || businessUser?.name || "Negocio"
      const email = businessUser?.email || ""
      const phone = businessUser?.phone_number || businessUser?.phone || ""
      const response = await fetch("/api/mercadopago/create-trial-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: businessId,
          businessName: businessName,
          email: email,
          phone: phone,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Error al crear el checkout")
      }

      // Redirect to MercadoPago checkout
      window.location.href = result.checkoutUrl
    } catch (error) {
      console.error("[Trial Payment] Error:", error)
      setTrialError(error instanceof Error ? error.message : "Error al procesar el pago")
      setIsTrialLoading(false)
    }
  }

  // Format date helper
  const formatSubscriptionDate = (date: Date | null | undefined): string => {
    if (!date) return ""
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
    return date.toLocaleDateString("es-CO", options)
  }

  // Get subscription end/renewal date
  const getSubscriptionEndDate = (): Date | null => {
    if (!subscription) return null

    // For trials, use end_date
    if (subscription.type === "trial" && subscription.end_date) {
      return subscription.end_date.toDate()
    }

    // For paid subscriptions, use current_period_end or next_payment_date
    if (subscription.current_period_end) {
      return subscription.current_period_end.toDate()
    }
    if (subscription.next_payment_date) {
      return subscription.next_payment_date.toDate()
    }

    return null
  }

  // Get subscription status message
  const getSubscriptionStatusMessage = (): { message: string; subMessage: string } | null => {
    if (!subscription || !isActive) return null

    const endDate = getSubscriptionEndDate()
    if (!endDate) return null

    const formattedDate = formatSubscriptionDate(endDate)
    const daysText = daysUntilExpiration !== null
      ? `(en ${daysUntilExpiration} día${daysUntilExpiration === 1 ? "" : "s"})`
      : ""

    // Trial subscription
    if (subscription.type === "trial" || subscription.status === "trial") {
      return {
        message: `Tu prueba termina el ${formattedDate}`,
        subMessage: daysText
      }
    }

    // Founder plan
    if (isFounder || subscription.plan === "fundador") {
      const periodLabel = subscription.billing_period === "monthly" ? "mensualmente" : "anualmente"
      return {
        message: `Tu Plan Fundador se renueva ${periodLabel} el ${formattedDate}`,
        subMessage: daysText
      }
    }

    // Regular paid subscription
    const planName = PLAN_FEATURES[subscription.plan as keyof typeof PLAN_FEATURES]?.name || subscription.plan
    if (subscription.billing_period === "monthly") {
      return {
        message: `Próximo pago del Plan ${planName}: ${formattedDate}`,
        subMessage: daysText
      }
    } else {
      return {
        message: `Tu Plan ${planName} se renueva el ${formattedDate}`,
        subMessage: daysText
      }
    }
  }

  const subscriptionStatus = getSubscriptionStatusMessage()

  return (
    <div className="space-y-8">
      {/* Header */}
      {!isPendingPayment && (
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">
            {isTrialExpired && !isFounder
              ? "Activa tu Plan Fundador"
              : "Elige el Plan Perfecto para tu Negocio"}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {isTrialExpired && !isFounder
              ? "Tu período de prueba finalizó. Continúa con el precio exclusivo de $480,000 COP/año — válido para los primeros 100 negocios."
              : "Comienza con alguno de nuestros planes y actualiza cuando lo necesites"}
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
      )}

      {/* Active Subscription Status Banner */}
      {subscriptionStatus && !isPendingPayment && !isTrialExpired && (
        <Card className="border-green-500/30 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 max-w-2xl mx-auto">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-500/20 p-2">
                  <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-200">
                    {subscriptionStatus.message}
                  </p>
                  {subscriptionStatus.subMessage && (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {subscriptionStatus.subMessage}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30">
                Activo
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Payment Banner - Complete Trial Payment */}
      {isPendingPayment && subscription?.plan === "trial" && (
        <Card className="border-2 border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left side - Message */}
              <div className="p-8 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-full text-sm font-medium mb-4 w-fit">
                  <CreditCard className="h-4 w-4" />
                  <span>Pago Pendiente</span>
                </div>

                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-3">
                  ¡Solo falta un paso para activar tu prueba!
                </h2>

                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed mb-6">
                  Completa el pago de <strong className="text-amber-600">{formatPrice(subscription?.amount || 20000)}</strong> para
                  activar tu período de prueba de 2 meses con acceso completo al plan Enterprise.
                </p>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3 text-sm lg:text-base">
                    <div className="rounded-full bg-green-500/20 p-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Ubicaciones y promociones ilimitadas</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm lg:text-base">
                    <div className="rounded-full bg-green-500/20 p-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Analíticas completas en tiempo real</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm lg:text-base">
                    <div className="rounded-full bg-green-500/20 p-1">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <span>Tu negocio visible para +1,800 usuarios</span>
                  </li>
                </ul>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg"
                    onClick={handleTrialPayment}
                    disabled={isTrialLoading}
                  >
                    {isTrialLoading ? (
                      "Procesando..."
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Completar Pago - {formatPrice(subscription?.amount || 20000)}
                      </>
                    )}
                  </Button>
                </div>

                {trialError && (
                  <p className="text-sm text-destructive mt-3">{trialError}</p>
                )}
              </div>

              {/* Right side - Visual */}
              <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 p-8">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-amber-500/20 mb-4">
                    <Rocket className="h-12 w-12 text-amber-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-4xl font-bold text-amber-600">2 meses</p>
                    <p className="text-lg text-muted-foreground">de acceso completo</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Pago 100% seguro con MercadoPago</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2026 Projections Video Section */}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-primary/5 shadow-xl">
        <CardContent className="p-0">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Video Content */}
            <div className="order-2 lg:order-1 p-6 lg:p-8">
              <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg">
                <iframe
                  src="https://www.youtube.com/embed/dRcycNpmUgE"
                  title="Proyecciones 2026 - Heroes Colombia"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>

            {/* Text Content */}
            <div className="order-1 lg:order-2 p-8 lg:p-10 flex flex-col justify-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-medium">
                  <Rocket className="h-4 w-4" />
                  <span>Exclusivo para negocios de Heroes Colombia</span>
                </div>

                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                  Descubre las Proyecciones 2026
                </h2>

                <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
                  Mira este video exclusivo donde te explicamos cómo será el crecimiento de Heroes Colombia
                  en 2026 y cómo tu negocio puede beneficiarse al continuar siendo parte de nuestra comunidad.
                </p>

                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm lg:text-base">
                    <div className="rounded-full bg-primary/20 p-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span>Nuevas funcionalidades que vienen en camino</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm lg:text-base">
                    <div className="rounded-full bg-primary/20 p-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span>Proyección de crecimiento de usuarios</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm lg:text-base">
                    <div className="rounded-full bg-primary/20 p-1">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span>Beneficios exclusivos para negocios activos</span>
                  </li>
                </ul>

                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <Play className="h-4 w-4" />
                  <span>Video de 7 minutos</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Founder / Trial-expired banner */}
      {showFoundadorOnly && !isPendingPayment && (
        <Card className={cn(
          "border-2",
          isTrialExpired
            ? "border-primary/40 bg-gradient-to-r from-primary/5 to-primary/10"
            : "border-amber-500 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20"
        )}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                "rounded-full p-3",
                isTrialExpired ? "bg-primary" : "bg-amber-500"
              )}>
                <Star className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                {isTrialExpired ? (
                  <>
                    <h3 className="text-lg font-bold">
                      Tu prueba terminó — activa el Plan Fundador
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      Por haber sido parte de los primeros en unirte, tienes derecho al
                      precio exclusivo de <span className="font-bold text-primary">$480,000 COP/año</span> —
                      el mismo que viste al registrarte. Este precio es válido solo para los
                      primeros 100 negocios.
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                      🎖️ Plan Fundador Exclusivo
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                      Como uno de los primeros negocios en unirse a Heroes Colombia,
                      tienes acceso al precio especial de fundador con todas las
                      funcionalidades Enterprise.
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing toggle — hidden in single-card (fundador) mode; annual is the only option */}
      {!isPendingPayment && !showFoundadorOnly && (
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
              Ahorra hasta 15%
            </Badge>
          )}
        </div>
      )}

      {!isPendingPayment && (
        <div className={cn(
          "grid gap-8",
          visiblePlans.length === 1
            ? "max-w-md mx-auto"
            : "md:grid-cols-2 lg:grid-cols-3"
        )}>
          {visiblePlans.map((plan) => {
            const config = PLAN_FEATURES[plan]
            const Icon = config.icon
            const price = getPlanPrice(plan, billingPeriod)
            const limits = getPlanLimits(plan)
            const isCurrentPlan = plan === currentPlan && !trialAvailable
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
                        {billingPeriod === "monthly" ? "/mes" : "/año"}
                      </span>
                    </div>
                    {earlyBirdActive && billingPeriod === "monthly" && plan !== "basico" && (
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
                      <span className="font-medium capitalize">{limits.analyticsLevel === "basic" ? "Básicas" : "Avanzadas"}</span>
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

                <CardFooter className="flex-col gap-2">
                  {(() => {
                    const isExpiredOrCancelled = subscription?.status === "expired" || subscription?.status === "cancelled"
                    const isOnTrial = subscription?.type === "trial" || subscription?.status === "trial"
                    const needsPayment = isTrialExpired || isExpiredOrCancelled

                    // Founder on trial (expired or not) - always allow payment
                    if (isFounder && (needsPayment || isOnTrial)) {
                      const isUrgent = isTrialExpired || (daysUntilExpiration !== null && daysUntilExpiration <= 7)
                      return (
                        <Button
                          className={cn(
                            "w-full text-white shadow-lg",
                            isUrgent
                              ? "bg-amber-500 hover:bg-amber-600"
                              : "bg-amber-400 hover:bg-amber-500"
                          )}
                          onClick={() => handleSelectPlan(plan)}
                          disabled={isLoading && selectedPlan === plan}
                        >
                          {isLoading && selectedPlan === plan ? (
                            "Procesando..."
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              {isTrialExpired ? "Pagar Plan Fundador" : "Activar Plan Fundador"}
                            </>
                          )}
                        </Button>
                      )
                    }

                    // Non-founder on trial (expired or not) - always allow payment
                    if (!isFounder && (needsPayment || isOnTrial)) {
                      const isUrgent = isTrialExpired || (daysUntilExpiration !== null && daysUntilExpiration <= 7)
                      const isFundador = plan === "fundador"
                      return (
                        <Button
                          className={cn(
                            "w-full shadow-lg",
                            isFundador
                              ? "bg-amber-500 hover:bg-amber-600 text-white"
                              : isUrgent
                                ? "bg-primary hover:bg-primary/90"
                                : "bg-primary/80 hover:bg-primary"
                          )}
                          size="lg"
                          onClick={() => handleSelectPlan(plan)}
                          disabled={isLoading && selectedPlan === plan}
                        >
                          {isLoading && selectedPlan === plan ? (
                            "Procesando..."
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              {isFundador
                                ? `Activar Plan Fundador — $480,000/año`
                                : `Activar ${config.name}`}
                            </>
                          )}
                        </Button>
                      )
                    }

                    // Current plan (only for paid subscriptions, not trials)
                    if (isCurrentPlan && !isOnTrial) {
                      return (
                        <Button variant="outline" className="w-full" disabled>
                          Plan Actual
                        </Button>
                      )
                    }

                    // Can upgrade - less prominent if user has active subscription
                    if (canUpgrade(plan)) {
                      return (
                        <Button
                          className={cn(
                            "w-full",
                            isActive && !isTrialExpired && "opacity-70"
                          )}
                          onClick={() => handleSelectPlan(plan)}
                          variant={isActive && !isTrialExpired ? "outline" : (isPopular ? "default" : "outline")}
                          disabled={isLoading && selectedPlan === plan}
                        >
                          {isLoading && selectedPlan === plan
                            ? "Procesando..."
                            : plan === "basico"
                              ? "Comenzar Básico"
                              : "Actualizar Plan"}
                        </Button>
                      )
                    }

                    // Can downgrade - less prominent if user has active subscription
                    if (canDowngrade(plan)) {
                      return (
                        <Button
                          variant={isActive && !isTrialExpired ? "outline" : "default"}
                          className={cn(
                            "w-full",
                            isActive && !isTrialExpired && "opacity-70"
                          )}
                          onClick={() => handleSelectPlan(plan)}
                          disabled={isLoading && selectedPlan === plan}
                        >
                          {isLoading && selectedPlan === plan
                            ? "Procesando..."
                            : `Cambiar a ${config.name}`}
                        </Button>
                      )
                    }

                    // Trial available
                    if (trialAvailable) {
                      return (
                        <Button
                          variant="secondary"
                          className="w-full"
                          onClick={() => handleSelectPlan(plan)}
                          disabled={isLoading && selectedPlan === plan}
                        >
                          {isLoading && selectedPlan === plan
                            ? "Procesando..."
                            : `Seguir en ${config.name}`}
                        </Button>
                      )
                    }

                    return null
                  })()}
                  {error && selectedPlan === plan && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Comparison Table - Hidden in single-card (fundador) mode */}
      {!showFoundadorOnly && (
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
                        {PLAN_LIMITS[plan].analyticsLevel === "advanced" ? (
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
                        {PLAN_LIMITS[plan].analyticsLevel === "advanced" ? (
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
      )}

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
