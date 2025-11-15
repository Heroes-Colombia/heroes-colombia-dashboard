"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { usePromotions } from "@/hooks/use-promotions"
import { AnalyticsEventService } from "@/lib/services/analytics-service"
import {
  calculateBasicAnalyticsFromEvents,
  calculateAdvancedAnalytics,
  calculateEnterpriseAnalytics,
  calculateFunnelData,
  calculateLocationAnalytics,
  calculateTimeSeriesData,
  filterPromotionsByDateRange,
  filterEventsByDateRange,
} from "@/lib/analytics-utils"
import type { FirebaseAnalyticsEvent, BusinessLocation } from "@/lib/types"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingCart,
  MapPin,
  Download,
  Mail,
  Crown,
  Activity,
  Users,
  BookmarkCheck,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { addDays } from "date-fns"
import { getPlanLimits } from "@/lib/plan-limits"
import { UpgradePlanButton } from "@/components/upgrade-plan-button"
import { LockedFeature, FeatureGate } from "@/components/locked-feature"
import type { PlanType } from "@/lib/types"

export default function BusinessAnalyticsPage() {
  const [analyticsEvents, setAnalyticsEvents] = useState<FirebaseAnalyticsEvent[]>([])
  const [locations, setLocations] = useState<BusinessLocation[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [selectedPromotion, setSelectedPromotion] = useState("all")
  const [selectedLocation, setSelectedLocation] = useState("all")
  const [reportType, setReportType] = useState("overview")

  const { user } = useAuth()
  const businessUser = user as any
  const { promotions, isLoading: promotionsLoading } = usePromotions({ businessId: businessUser?.businessId })
  const plan: PlanType = businessUser?.plan || "gratis"
  const limits = getPlanLimits(plan)
  

  // Analytics tier access
  const analyticsLevel = limits.analyticsLevel
  const hasBasic = analyticsLevel === "basic" || analyticsLevel === "advanced" || analyticsLevel === "enterprise"
  const hasAdvanced = analyticsLevel === "advanced" || analyticsLevel === "enterprise"
  const hasEnterprise = analyticsLevel === "enterprise"
  const hasPerLocationAnalytics = limits.perLocationAnalytics

  // Fetch analytics events when business or date range changes
  useEffect(() => {
    async function fetchAnalyticsData() {
      if (!businessUser?.businessId) return

      setIsLoadingEvents(true)
      try {
        const events = await AnalyticsEventService.getAnalyticsEvents(businessUser.businessId, {
          dateRange,
        })
        setAnalyticsEvents(events)
      } catch (error) {
        console.error("Error fetching analytics events:", error)
      } finally {
        setIsLoadingEvents(false)
      }
    }

    fetchAnalyticsData()
  }, [businessUser?.businessId, dateRange])

  // Calculate analytics based on plan level
  const filteredPromotions = useMemo(() => {
    return promotions && filterPromotionsByDateRange(promotions || [], dateRange)
  }, [promotions, dateRange])

  const filteredEvents = useMemo(() => {
    return filterEventsByDateRange(analyticsEvents, dateRange)
  }, [analyticsEvents, dateRange])

  const basicAnalytics = useMemo(() => {
    return calculateBasicAnalyticsFromEvents(analyticsEvents)
  }, [filteredPromotions])

  const advancedAnalytics = useMemo(() => {
    if (plan === "pro" || plan === "enterprise") {
      return calculateAdvancedAnalytics(filteredEvents)
    }
    return null
  }, [plan, filteredPromotions, filteredEvents])

  const enterpriseAnalytics = useMemo(() => {
    if (plan === "enterprise") {
      return filteredPromotions && calculateEnterpriseAnalytics(filteredPromotions, filteredEvents)
    }
    return null
  }, [plan, filteredPromotions, filteredEvents])

  const funnelData = useMemo(() => {
    return calculateFunnelData(filteredEvents)
  }, [filteredPromotions, filteredEvents])

  const timeSeriesData = useMemo(() => {
    if (filteredEvents.length > 0) {
      return calculateTimeSeriesData(filteredEvents, dateRange)
    }
    return []
  }, [filteredEvents, dateRange])

  const locationAnalyticsData = useMemo(() => {
    if (hasPerLocationAnalytics && filteredEvents.length > 0 && locations.length > 0) {
      return calculateLocationAnalytics(filteredEvents, locations)
    }
    return []
  }, [hasPerLocationAnalytics, filteredEvents, locations])

  const handleExportReport = (format: "csv" | "pdf") => {
    // TODO: Implement export functionality
    console.log(`Exporting ${reportType} report as ${format}`)
  }

  const handleScheduleReport = () => {
    // TODO: Implement report scheduling
    console.log("Scheduling report")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analíticas</h1>
          <p className="text-muted-foreground">Métricas detalladas de rendimiento de tus promociones</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={hasAdvanced ? "default" : "secondary"} className="flex items-center gap-1">
            {hasAdvanced && <Crown className="h-3 w-3" />}
            {analyticsLevel === "basic" && "Básico"}
            {analyticsLevel === "advanced" && "Avanzado"}
            {analyticsLevel === "enterprise" && "Enterprise"}
          </Badge>
        </div>
      </div>

      {/* Plan Upgrade Alert for Basic */}
      {!hasAdvanced && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Desbloquea Analíticas Avanzadas</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Accede a tasa de conversión, ingresos atribuidos, demografía de usuarios y más.
                </p>
                <UpgradePlanButton
                  currentPlan={plan}
                  targetPlan="pro"
                  feature="analíticas avanzadas"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        <Select value={selectedPromotion} onValueChange={setSelectedPromotion}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Seleccionar promoción" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las promociones</SelectItem>
            {promotions && promotions.map((promo) => (
              <SelectItem key={promo.id} value={promo.id}>
                {promo.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasPerLocationAnalytics && (
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-48">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Seleccionar ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ubicaciones</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={reportType} onValueChange={setReportType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo de reporte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Resumen</SelectItem>
            <SelectItem value="detailed">Detallado</SelectItem>
            <SelectItem value="comparison">Comparación</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics - Basic (All Plans) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impresiones</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicAnalytics.impressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+12% vs período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vistas</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicAnalytics.views.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+8% vs período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negocio Favorito</CardTitle>
            <BookmarkCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicAnalytics.saves.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground"># veces tu negocio es guardado como favorito</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promociones favoritas</CardTitle>
            <BookmarkCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicAnalytics.promotionSaves.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground"># veces que las promociones se guardan como favoritos</p>
          </CardContent>
        </Card>

        {/* TODO */}
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redenciones</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicAnalytics.redemptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15% vs período anterior</p>
          </CardContent>
        </Card> */}
      </div>

      {/* Charts Section - Basic */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencias Temporales</CardTitle>
            <CardDescription>Evolución de métricas en el tiempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="impressions" stroke="#7A8B5A" strokeWidth={2} name="Impresiones" />
                <Line type="monotone" dataKey="views" stroke="#1E3A8A" strokeWidth={2} name="Vistas" />
                <Line type="monotone" dataKey="saves" stroke="#059669" strokeWidth={2} name="Guardados" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Embudo de Conversión</CardTitle>
            <CardDescription>Flujo de usuarios desde impresión hasta redención</CardDescription>
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
                  label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                >
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Features - Pro+ */}
      <FeatureGate
        currentPlan={plan}
        requiredPlan="pro"
        featureName="Analíticas Avanzadas"
        description="Accede a métricas de conversión, ingresos, y demografía de usuarios."
        lockedVariant="card"
      >
        <>
          {/* Conversion & Revenue Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{advancedAnalytics?.conversionRate.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground">Tasa de conversión</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Atribuidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${advancedAnalytics?.revenue.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Estimado</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingreso por Redención</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${advancedAnalytics?.averageRevenuePerRedemption.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-primary" />
                Análisis de Ingresos
              </CardTitle>
              <CardDescription>Ingresos atribuidos a promociones</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#7A8B5A" fill="#7A8B5A" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Demographics */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Demografía por Edad</CardTitle>
              </CardHeader>
              <CardContent>
                {advancedAnalytics?.demographics.age && advancedAnalytics.demographics.age.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={advancedAnalytics.demographics.age}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#7A8B5A" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                    No hay datos de edad disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Fuerza</CardTitle>
              </CardHeader>
              <CardContent>
                {advancedAnalytics?.demographics.rank && advancedAnalytics.demographics.rank.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={advancedAnalytics.demographics.rank}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        fill="#1E3A8A"
                        dataKey="value"
                        label={({ rank, value }) => `${rank}: ${value}%`}
                      />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                    No hay datos de rangos disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usuarios por Ciudad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {advancedAnalytics?.demographics.cities && advancedAnalytics.demographics.cities.length > 0 ? (
                    advancedAnalytics.demographics.cities.map((city, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{city.city}</span>
                        </div>
                        <span className="text-sm font-medium">{city.users}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No hay datos de ciudades disponibles</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      </FeatureGate>

      {/* Per-Location Analytics - Pro+ with perLocationAnalytics flag */}
      {hasPerLocationAnalytics && locationAnalyticsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-primary" />
              Análisis por Ubicación
            </CardTitle>
            <CardDescription>Rendimiento de cada ubicación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {locationAnalyticsData.map((loc, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{loc.location}</h4>
                    <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                      <span>{loc.impressions.toLocaleString()} impresiones</span>
                      <span>{loc.views.toLocaleString()} vistas</span>
                      <span>{loc.redemptions} redenciones</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {loc.views > 0 ? ((loc.redemptions / loc.views) * 100).toFixed(1) : 0}%
                    </div>
                    <div className="text-xs text-muted-foreground">Conversión</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enterprise Features */}
      <FeatureGate
        currentPlan={plan}
        requiredPlan="enterprise"
        featureName="Analíticas Enterprise"
        description="Mapas de calor, análisis de cohortes, y benchmarking con la industria."
        lockedVariant="card"
      >
        <>
          {/* Heatmaps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-secondary" />
                Mapas de Calor
              </CardTitle>
              <CardDescription>Análisis de interacción por página</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {enterpriseAnalytics && enterpriseAnalytics.heatmaps && enterpriseAnalytics.heatmaps.length > 0 ? (
                  enterpriseAnalytics.heatmaps.map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{page.page}</h4>
                        <p className="text-sm text-muted-foreground">
                          {page.clicks} clics
                        </p>
                      </div>
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${Math.min((page.clicks / 250) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No hay datos de mapas de calor disponibles</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cohort Analysis & Benchmarking */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Cohortes</CardTitle>
                <CardDescription>Retención de usuarios por mes</CardDescription>
              </CardHeader>
              <CardContent>
                {enterpriseAnalytics && enterpriseAnalytics.cohorts && enterpriseAnalytics.cohorts.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={enterpriseAnalytics.cohorts}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="retention" stroke="#1E3A8A" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
                    No hay datos de cohortes disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Benchmarking</CardTitle>
                <CardDescription>Comparación con la industria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tu conversión</span>
                    <span className="text-lg font-bold text-primary">
                      {enterpriseAnalytics?.benchmarking.myConversion.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Promedio industria</span>
                    <span className="text-lg font-bold text-muted-foreground">
                      {enterpriseAnalytics?.benchmarking.industryAverage.toFixed(1) || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Top performers</span>
                    <span className="text-lg font-bold text-secondary">
                      {enterpriseAnalytics?.benchmarking.topPerformers.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      </FeatureGate>

      {/* TODO implement this section later on */}
      {/* Export and Scheduling */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Exportar y Programar Reportes</CardTitle>
          <CardDescription>Descarga reportes o programa envíos automáticos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={() => handleExportReport("csv")} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button onClick={() => handleExportReport("pdf")} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={handleScheduleReport} variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              Programar Envío
            </Button>
            <Select defaultValue="weekly">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diario</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
