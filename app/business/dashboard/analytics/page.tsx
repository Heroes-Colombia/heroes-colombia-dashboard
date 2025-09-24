"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  Lock,
  BarChart3,
  Activity,
} from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { addDays } from "date-fns"
import Link from "next/link"

// Mock analytics data
const basicAnalytics = {
  impressions: 45678,
  views: 23456,
  redemptions: 1234,
  conversionRate: 5.3,
}

const proAnalytics = {
  ...basicAnalytics,
  revenue: 2340000,
  demographics: {
    age: [
      { range: "18-25", value: 25 },
      { range: "26-35", value: 35 },
      { range: "36-45", value: 28 },
      { range: "46-55", value: 12 },
    ],
    rank: [
      { rank: "Soldado", value: 40 },
      { rank: "Cabo", value: 25 },
      { rank: "Sargento", value: 20 },
      { rank: "Teniente", value: 10 },
      { rank: "Capitán", value: 5 },
    ],
    cities: [
      { city: "Bogotá", users: 1234 },
      { city: "Medellín", users: 876 },
      { city: "Cali", users: 654 },
      { city: "Barranquilla", users: 432 },
    ],
  },
}

const enterpriseAnalytics = {
  ...proAnalytics,
  heatmaps: [
    { page: "Promoción 1", clicks: 234, time: 45 },
    { page: "Promoción 2", clicks: 189, time: 38 },
    { page: "Promoción 3", clicks: 156, time: 42 },
  ],
  cohorts: [
    { month: "Enero", retention: 85 },
    { month: "Febrero", retention: 78 },
    { month: "Marzo", retention: 72 },
    { month: "Abril", retention: 68 },
  ],
  benchmarking: {
    industry: "Restaurantes",
    myConversion: 5.3,
    industryAverage: 4.8,
    topPerformers: 7.2,
  },
}

const timeSeriesData = [
  { date: "2024-01-01", impressions: 1200, views: 800, redemptions: 45, revenue: 180000 },
  { date: "2024-01-02", impressions: 1900, views: 1200, redemptions: 67, revenue: 268000 },
  { date: "2024-01-03", impressions: 800, views: 600, redemptions: 32, revenue: 128000 },
  { date: "2024-01-04", impressions: 2400, views: 1800, redemptions: 89, revenue: 356000 },
  { date: "2024-01-05", impressions: 3200, views: 2400, redemptions: 134, revenue: 536000 },
  { date: "2024-01-06", impressions: 2800, views: 2100, redemptions: 112, revenue: 448000 },
  { date: "2024-01-07", impressions: 1600, views: 1100, redemptions: 78, revenue: 312000 },
]

const funnelData = [
  { name: "Impresiones", value: 45678, fill: "#7A8B5A" },
  { name: "Vistas", value: 23456, fill: "#1E3A8A" },
  { name: "Guardadas", value: 8765, fill: "#059669" },
  { name: "Redenciones", value: 1234, fill: "#DC2626" },
]

export default function BusinessAnalyticsPage() {
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [selectedPromotion, setSelectedPromotion] = useState("all")
  const [reportType, setReportType] = useState("overview")

  const user = getCurrentUser("business") as any
  const plan = user?.plan || "gratis"
  const isPro = plan === "pro"
  const isEnterprise = plan === "enterprise"
  const isPremium = isPro || isEnterprise

  const getAvailableMetrics = () => {
    const base = ["impressions", "views", "redemptions"]
    if (isPremium) {
      base.push("conversion", "revenue", "demographics")
    }
    if (isEnterprise) {
      base.push("heatmaps", "cohorts", "benchmarking", "ab_testing")
    }
    return base
  }

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
          <Badge variant={isPremium ? "default" : "secondary"} className="flex items-center gap-1">
            {isPremium && <Crown className="h-3 w-3" />}
            Plan {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Plan Upgrade Alert */}
      {!isPremium && (
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription>
            Actualiza a Pro o Enterprise para acceder a métricas avanzadas como tasa de conversión, ingresos atribuidos
            y demografía de usuarios.{" "}
            <Link href="/business/dashboard/billing" className="text-primary hover:underline">
              Ver planes
            </Link>
          </AlertDescription>
        </Alert>
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
            <SelectItem value="promo1">Descuento 20% Almuerzo</SelectItem>
            <SelectItem value="promo2">2x1 Bebidas</SelectItem>
            <SelectItem value="promo3">Envío Gratis</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Key Metrics */}
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
            <CardTitle className="text-sm font-medium">Redenciones</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{basicAnalytics.redemptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+15% vs período anterior</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isPremium ? "Tasa de Conversión" : "Conversión"}
              {!isPremium && <Lock className="h-3 w-3 ml-1" />}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isPremium ? `${basicAnalytics.conversionRate}%` : "---"}</div>
            <p className="text-xs text-muted-foreground">
              {isPremium ? "+0.3% vs período anterior" : "Disponible en Pro+"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
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
                <Line type="monotone" dataKey="redemptions" stroke="#059669" strokeWidth={2} name="Redenciones" />
                {isPremium && (
                  <Line type="monotone" dataKey="revenue" stroke="#DC2626" strokeWidth={2} name="Ingresos" />
                )}
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

      {/* Pro Features */}
      {isPremium && (
        <>
          {/* Revenue Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Crown className="h-5 w-5 mr-2 text-primary" />
                Análisis de Ingresos
              </CardTitle>
              <CardDescription>Ingresos atribuidos a promociones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">${proAnalytics.revenue.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Ingresos Totales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">
                    ${Math.round(proAnalytics.revenue / proAnalytics.redemptions).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Ingreso por Redención</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{proAnalytics.conversionRate}%</div>
                  <div className="text-sm text-muted-foreground">Tasa de Conversión</div>
                </div>
              </div>
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
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={proAnalytics.demographics.age}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#7A8B5A" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Rango</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={proAnalytics.demographics.rank}
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usuarios por Ciudad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {proAnalytics.demographics.cities.map((city, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{city.city}</span>
                      </div>
                      <span className="text-sm font-medium">{city.users}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Enterprise Features */}
      {isEnterprise && (
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
                {enterpriseAnalytics.heatmaps.map((page, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{page.page}</h4>
                      <p className="text-sm text-muted-foreground">
                        {page.clicks} clics, {page.time}s promedio
                      </p>
                    </div>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(page.clicks / 250) * 100}%` }} />
                    </div>
                  </div>
                ))}
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
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={enterpriseAnalytics.cohorts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="retention" stroke="#1E3A8A" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
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
                      {enterpriseAnalytics.benchmarking.myConversion}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Promedio industria</span>
                    <span className="text-lg font-bold text-muted-foreground">
                      {enterpriseAnalytics.benchmarking.industryAverage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Top performers</span>
                    <span className="text-lg font-bold text-secondary">
                      {enterpriseAnalytics.benchmarking.topPerformers}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Export and Scheduling */}
      <Card>
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
      </Card>

      {/* Locked Features for Basic Plans */}
      {!isPremium && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Análisis de Ingresos
              </CardTitle>
              <CardDescription>Disponible en planes Pro y Enterprise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Accede a métricas de ingresos, demografía y análisis avanzados
                </p>
                <Button asChild>
                  <Link href="/business/dashboard/billing">Actualizar Plan</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Mapas de Calor
              </CardTitle>
              <CardDescription>Disponible en plan Enterprise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">Análisis de comportamiento, cohortes y benchmarking</p>
                <Button asChild>
                  <Link href="/business/dashboard/billing">Ver Enterprise</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
