"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingCart,
  Calendar,
  Crown,
  AlertCircle,
  Plus,
  ArrowUpRight,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { usePromotions } from "@/hooks/use-promotions"
import { AnalyticsEventService } from "@/lib/services/analytics-service"
import { calculateBasicAnalytics, calculateFunnelData, calculateTimeSeriesData, filterEventsByDateRange } from "@/lib/analytics-utils"
import Link from "next/link"
import { addDays } from "date-fns"
import type { Promotion, FirebaseAnalyticsEvent } from "@/lib/types"

export default function BusinessDashboardPage() {
  const { user } = useAuth()
  const [analyticsEvents, setAnalyticsEvents] = useState<FirebaseAnalyticsEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)

  const businessUser = user as any
  const plan = businessUser?.plan || "gratis"
  const { promotions } = usePromotions({ businessId: businessUser?.businessId })
  const isPremium = plan === "pro" || plan === "enterprise"

  const daysUntilRenovation = Math.round((new Date('2026-01-30').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  // Fetch last 7 days of analytics events
  useEffect(() => {
    async function fetchAnalyticsData() {
      if (!businessUser?.businessId) return

      setIsLoadingEvents(true)
      try {
        const events = await AnalyticsEventService.getAnalyticsEvents(businessUser.businessId, {
          dateRange: {
            from: addDays(new Date(), -7),
            to: new Date(),
          },
        })
        setAnalyticsEvents(events)
      } catch (error) {
        console.error("Error fetching analytics events:", error)
      } finally {
        setIsLoadingEvents(false)
      }
    }

    fetchAnalyticsData()
  }, [businessUser?.businessId])

  // Calculate analytics from real data
  const analytics = useMemo(() => {
    return calculateBasicAnalytics(promotions || [])
  }, [promotions])

  const funnelData = useMemo(() => {
    const funnel = calculateFunnelData(promotions || [], analyticsEvents)
    return funnel.map((item) => ({ ...item, color: item.fill }))
  }, [promotions, analyticsEvents])

  const impressionsData = useMemo(() => {
    if (analyticsEvents.length > 0) {
      const timeSeriesData = calculateTimeSeriesData(analyticsEvents, {
        from: addDays(new Date(), -7),
        to: new Date(),
      })
      return timeSeriesData.map((item, index) => ({
        name: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][new Date(new Date().getTime() - (6 - index) * 24 * 60 * 60 * 1000).getDay()],
        impressions: item.impressions,
        views: item.views,
        redemptions: item.redemptions,
      }))
    }
    return []
  }, [analyticsEvents])

  const activePromotions = useMemo(() => {
    return promotions && promotions.filter((p) => p.status === "active")
  }, [promotions])

  const topActivePromotions = useMemo(() => {
    // Get top 5 promotions sorted by views (most viewed first)
    return promotions && promotions
      .filter((p) => p.status === "active")
      .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      .slice(0, 5)
  }, [promotions])

  const getKPIsByPlan = () => {
    const baseKPIs = [
      { title: "Promociones Activas", value: activePromotions?.length, icon: ShoppingCart, change: `${promotions?.length} total` },
      { title: "Total Impresiones", value: analytics.impressions, icon: Eye, change: "Últimos 30 días" },
      { title: "Total Vistas", value: analytics.views, icon: TrendingUp, change: "Últimos 30 días" },
      { title: "Guardadas", value: analytics.saves, icon: MousePointer, change: "Favoritas" },
    ]

    return baseKPIs
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">¡Bienvenido de vuelta!</h1>
          <p className="text-muted-foreground">Aquí tienes un resumen de tu actividad en Héroes Colombia</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={isPremium ? "default" : "secondary"} className="flex items-center gap-1">
            {isPremium && <Crown className="h-3 w-3" />}
            Plan {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </Badge>
          {!isPremium && (
            <Button asChild>
              <Link href="/business/dashboard/plans">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Actualizar Plan
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Plan Status Alert */}
      {plan === "gratis" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Estás en el plan gratuito. Publica promociones por $11,900 COP cada una o{" "}
            <Link href="/business/dashboard/plan" className="text-primary hover:underline underline">
              actualiza tu plan aquí
            </Link> para acceso ilimitado.
          </AlertDescription>
        </Alert>
      )}

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {getKPIsByPlan().map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia Semanal</CardTitle>
            <CardDescription>Impresiones, vistas y redenciones en los últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={impressionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="impressions" stroke="#7A8B5A" strokeWidth={2} />
                <Line type="monotone" dataKey="views" stroke="#1E3A8A" strokeWidth={2} />
                <Line type="monotone" dataKey="redemptions" stroke="#059669" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Embudo de Conversión</CardTitle>
            <CardDescription>Desde impresiones hasta redenciones</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={funnelData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Promotions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Promociones Destacadas</CardTitle>
            <CardDescription>Tus promociones con mejor rendimiento</CardDescription>
          </div>
          <Button asChild>
            <Link href="/business/dashboard/promotions">
              <Plus className="h-4 w-4 mr-1" />
              Nueva Promoción
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topActivePromotions && topActivePromotions.length > 0 ? (
              topActivePromotions.map((promo, index) => (
                <div key={promo.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      #{index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{promo.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {promo.views_count || 0} vistas
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointer className="h-3 w-3" />
                          {promo.saves_count || 0} guardadas
                        </span>
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          {promo.redemptions_count || 0} redenciones
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={promo.status === "active" ? "default" : "secondary"}>
                      {promo.status}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-4">No tienes promociones activas todavía</p>
                <Button asChild size="sm">
                  <Link href="/business/dashboard/promotions">
                    <Plus className="h-4 w-4 mr-1" />
                    Crear Primera Promoción
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próxima Renovación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{daysUntilRenovation}</p>
                <p className="text-sm text-muted-foreground">días restantes</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress value={50} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Límite de Promociones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{activePromotions?.length}{plan === "gratis" ? "/1" : plan === "basico" ? "/3" : plan === "pro" ? "/10" : "/∞"}</p>
                <p className="text-sm text-muted-foreground">activas este mes</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress value={plan === "gratis" ? 100 : plan === "basico" ? 80 : 30} className="mt-3" />
          </CardContent>
        </Card>

        // TODO implement this section later on
        {/* <Card>
          <CardHeader>
            <CardTitle className="text-base">Soporte</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {isPremium ? "Chat en vivo disponible" : "Soporte por email"}
            </p>
            <Button variant="outline" className="w-full bg-transparent">
              {isPremium ? "Abrir Chat" : "Enviar Email"}
            </Button>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
