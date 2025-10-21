"use client"

import { useState } from "react"
import { useBusinesses } from "@/hooks/use-businesses"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import {
  Crown,
  DollarSign,
  Users,
  MapPin,
  Tag,
  BarChart3,
  Settings,
  Check,
  X,
  Edit,
  Download,
  Star,
  Zap,
  Shield,
  TrendingUp,
} from "lucide-react"
import { getCurrentPricing } from "@/lib/pricing-config"
import { PLAN_LIMITS } from "@/lib/plan-limits"
import type { PlanType } from "@/lib/types"

export default function AdminPlansPage() {
  const { businesses, isLoading } = useBusinesses()
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const pricing = getCurrentPricing()

  // Calculate real subscription stats from businesses
  const subscriptionStats = {
    gratis: {
      count: businesses.filter(b => !b.plan || b.plan === "gratis").length,
      revenue: 0,
      growth: "+0%"
    },
    basico: {
      count: businesses.filter(b => b.plan === "basico").length,
      revenue: businesses.filter(b => b.plan === "basico").length * pricing.regularPlans.basico.monthly,
      growth: "+0%"
    },
    pro: {
      count: businesses.filter(b => b.plan === "pro").length,
      revenue: businesses.filter(b => b.plan === "pro").length * pricing.regularPlans.pro.monthly,
      growth: "+0%"
    },
    enterprise: {
      count: businesses.filter(b => b.plan === "enterprise").length,
      revenue: businesses.filter(b => b.plan === "enterprise").length * pricing.regularPlans.enterprise.monthly,
      growth: "+0%"
    },
  }

  const getPlanIcon = (planId: PlanType) => {
    switch (planId) {
      case "gratis":
        return <Zap className="h-5 w-5 text-gray-500" />
      case "basico":
        return <Shield className="h-5 w-5 text-blue-500" />
      case "pro":
        return <Crown className="h-5 w-5 text-primary" />
      case "enterprise":
        return <TrendingUp className="h-5 w-5 text-secondary" />
      default:
        return <Settings className="h-5 w-5" />
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatLimitValue = (value: number) => {
    return value === Infinity ? "Ilimitado" : value.toString()
  }

  const exportPlansReport = () => {
    const csvContent = [
      "Plan,Precio Mensual,Precio Anual,Suscriptores,Ingresos Mensuales,Ubicaciones Máx,Promociones Máx,Usuarios Máx,Analíticas",
      ...(Object.keys(PLAN_LIMITS) as PlanType[]).map(planId => {
        const limits = PLAN_LIMITS[planId]
        const stats = subscriptionStats[planId]
        const prices = planId === "gratis" ? { monthly: 0, annual: 0 } : pricing.regularPlans[planId as "basico" | "pro" | "enterprise"]

        return `"Plan ${planId}",${prices.monthly},${prices.annual},${stats.count},${stats.revenue},${formatLimitValue(limits.maxLocations)},${limits.maxActivePromotions === null ? "Pay-per-use" : formatLimitValue(limits.maxActivePromotions === Infinity ? Infinity : limits.maxActivePromotions)},${formatLimitValue(limits.maxUsers)},"${limits.analyticsLevel}"`
      })
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte_planes_heroes_colombia_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const totalRevenue = Object.values(subscriptionStats).reduce((sum, stat) => sum + stat.revenue, 0)
  const totalSubscribers = Object.values(subscriptionStats).reduce((sum, stat) => sum + stat.count, 0)

  const planNames = {
    gratis: "Gratis",
    basico: "Básico",
    pro: "Pro",
    enterprise: "Enterprise"
  }

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Cargando estadísticas de planes...</span>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Gestión de Planes</h1>
              <p className="text-muted-foreground">Administra los planes de suscripción y estadísticas</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {totalSubscribers.toLocaleString()} suscriptores
              </Badge>
              <Badge variant="default" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {formatPrice(totalRevenue)} mensual
              </Badge>
              <Button onClick={exportPlansReport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Exportar reporte
              </Button>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(subscriptionStats) as PlanType[]).map((planId) => {
              const stats = subscriptionStats[planId]

              return (
                <Card key={planId}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getPlanIcon(planId)}
                        <span className="font-medium text-sm">{planNames[planId]}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {stats.growth}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold">
                        {stats.count.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatPrice(stats.revenue)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Plans Overview */}
          <div className="grid gap-6">
            {(Object.keys(PLAN_LIMITS) as PlanType[]).map((planId) => {
              const limits = PLAN_LIMITS[planId]
              const stats = subscriptionStats[planId]
              const prices = planId === "gratis" ? { monthly: 0, annual: 0 } : pricing.regularPlans[planId as "basico" | "pro" | "enterprise"]

              return (
                <Card key={planId}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPlanIcon(planId)}
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {planNames[planId]}
                            {planId === "pro" && <Star className="h-4 w-4 text-yellow-500" />}
                            {planId === "enterprise" && <Crown className="h-4 w-4 text-purple-500" />}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-2xl font-bold">{formatPrice(prices.monthly)}</span>
                            <span className="text-sm text-muted-foreground">/mes</span>
                            {prices.annual > 0 && (
                              <>
                                <span className="text-muted-foreground">o</span>
                                <span className="text-lg font-semibold">{formatPrice(prices.annual)}</span>
                                <span className="text-sm text-muted-foreground">/año</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold">
                          {stats.count.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">suscriptores</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Limits */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="font-medium">{formatLimitValue(limits.maxLocations)}</span> ubicaciones
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="font-medium">
                            {limits.maxActivePromotions === null
                              ? "Pay-per-use"
                              : limits.maxActivePromotions === Infinity
                                ? "Ilimitadas"
                                : limits.maxActivePromotions}
                          </span> promociones
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="font-medium">{formatLimitValue(limits.maxUsers)}</span> usuarios
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          <span className="font-medium capitalize">{limits.analyticsLevel}</span>
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Características</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Check className="h-3 w-3 text-green-600" />
                          <span className="text-xs">Analíticas {limits.analyticsLevel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {limits.perLocationAnalytics ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                          <span className="text-xs">Análisis por ubicación</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {limits.maxUsers > 1 ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                          <span className="text-xs">Gestión de equipo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {limits.analyticsLevel === "advanced" || limits.analyticsLevel === "enterprise" ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                          <span className="text-xs">Demografía de usuarios</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {limits.analyticsLevel === "enterprise" ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                          <span className="text-xs">Mapas de calor</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {planId === "enterprise" ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                          <span className="text-xs">Gerente de cuenta dedicado</span>
                        </div>
                      </div>
                    </div>

                    {/* Extra Promotions Info */}
                    {(planId === "gratis" || planId === "basico") && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          {planId === "gratis"
                            ? "💡 Cada promoción activa cuesta $11,900 COP/mes"
                            : "💡 Promociones adicionales disponibles por $11,900 COP c/u"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Note about editing */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">Configuración de Planes</h4>
                  <p className="text-xs text-muted-foreground">
                    Los precios y límites de los planes se gestionan en <code className="bg-muted px-1 py-0.5 rounded">lib/pricing-config.ts</code> y <code className="bg-muted px-1 py-0.5 rounded">lib/plan-limits.ts</code>.
                    Las estadísticas mostradas son en tiempo real basadas en los negocios registrados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
