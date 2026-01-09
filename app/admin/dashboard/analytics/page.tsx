"use client"

import { useState } from "react"
import { useBusinesses } from "@/hooks/use-businesses"
import { usePromotions } from "@/hooks/use-promotions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
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
import { Building2, Users, Tag, DollarSign, Download, MapPin, Activity } from "lucide-react"
import { addDays } from "date-fns"

export default function AdminAnalyticsPage() {
  const { businesses, isLoading: businessesLoading } = useBusinesses()
  const { promotions, isLoading: promotionsLoading } = usePromotions()

  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [selectedMetric, setSelectedMetric] = useState("overview")
  const [selectedRegion, setSelectedRegion] = useState("all")

  // Calculate real analytics data
  const globalKPIs = {
    totalBusinesses: businesses.length,
    activePromotions: promotions && promotions.filter(p => p.status === "active").length,
    totalUsers: 0, // Would need to implement users fetching
    totalRedemptions: 0, // Would need to implement redemptions fetching
    platformRevenue: businesses.filter(b => b.plan === "basico").length * 50000 +
      businesses.filter(b => b.plan === "pro").length * 150000 +
      businesses.filter(b => b.plan === "enterprise").length * 500000,
    monthlyGrowth: 0, // Would need historical data
  }

  const planAdoption = [
    { plan: "Básico", count: businesses.filter(b => b.plan === "basico").length, revenue: businesses.filter(b => b.plan === "basico").length * 50000, color: "#7A8B5A" },
    { plan: "Pro", count: businesses.filter(b => b.plan === "pro").length, revenue: businesses.filter(b => b.plan === "pro").length * 150000, color: "#1E3A8A" },
    { plan: "Enterprise", count: businesses.filter(b => b.plan === "enterprise").length, revenue: businesses.filter(b => b.plan === "enterprise").length * 500000, color: "#059669" },
  ]

  // Create current month snapshot data (placeholder for trend analysis)
  const platformTrends = [
    {
      month: "Actual",
      businesses: globalKPIs.totalBusinesses,
      users: globalKPIs.totalUsers,
      promotions: globalKPIs.activePromotions,
      revenue: Math.round((globalKPIs.platformRevenue || 0) / 1000000)
    }
  ]

  // Create churn analysis data (placeholder for actual churn tracking)
  const churnAnalysis = [
    {
      month: "Actual",
      newBusinesses: globalKPIs.totalBusinesses,
      churnedBusinesses: 0, // Would need historical tracking
      netGrowth: globalKPIs.totalBusinesses
    }
  ]

  // Create geographic data (placeholder - would need actual location tracking)
  const geoHeatmap = [
    { region: "Total", businesses: globalKPIs.totalBusinesses, users: globalKPIs.totalUsers, revenue: globalKPIs.platformRevenue },
  ]

  const handleExportReport = (format: "csv" | "pdf") => {
    console.log(`Exporting admin analytics as ${format}`)
  }

  // Show loading state while data is being fetched
  if (businessesLoading || promotionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Cargando analíticas...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analíticas Globales</h1>
          <p className="text-muted-foreground">Métricas y tendencias de toda la plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => handleExportReport("csv")} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        <Select value={selectedMetric} onValueChange={setSelectedMetric}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Seleccionar métrica" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">Resumen General</SelectItem>
            <SelectItem value="businesses">Empresas</SelectItem>
            <SelectItem value="users">Usuarios</SelectItem>
            <SelectItem value="revenue">Ingresos</SelectItem>
            <SelectItem value="geographic">Geográfico</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedRegion} onValueChange={setSelectedRegion}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Región" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="bogota">Bogotá</SelectItem>
            <SelectItem value="medellin">Medellín</SelectItem>
            <SelectItem value="cali">Cali</SelectItem>
            <SelectItem value="barranquilla">Barranquilla</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Global KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(globalKPIs.totalBusinesses || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{(globalKPIs.monthlyGrowth || 0)}% este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(globalKPIs.totalUsers || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">MAU activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promociones</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(globalKPIs.activePromotions || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">activas hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redenciones</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(globalKPIs.totalRedemptions || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${((globalKPIs.platformRevenue || 0) / 1000000).toFixed(0)}M</div>
            <p className="text-xs text-muted-foreground">ingresos mensuales</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Growth Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Crecimiento de la Plataforma</CardTitle>
          <CardDescription>Evolución mensual de métricas clave</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={platformTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="businesses" stroke="#7A8B5A" strokeWidth={2} name="Empresas" />
              <Line type="monotone" dataKey="users" stroke="#1E3A8A" strokeWidth={2} name="Usuarios" />
              <Line type="monotone" dataKey="promotions" stroke="#059669" strokeWidth={2} name="Promociones" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Plan Adoption and User Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Adopción de Planes</CardTitle>
            <CardDescription>Distribución de empresas por plan de suscripción</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planAdoption}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ plan, count }) => `${plan}: ${count}`}
                >
                  {planAdoption.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader>
            <CardTitle>Actividad de Usuarios</CardTitle>
            <CardDescription>DAU vs MAU en los últimos 7 días</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="dau" fill="#7A8B5A" name="DAU" />
                <Bar dataKey="mau" fill="#1E3A8A" name="MAU" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card> */}
      </div>

      {/* Geographic Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            Distribución Geográfica
          </CardTitle>
          <CardDescription>Empresas, usuarios e ingresos por región</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {geoHeatmap.map((region, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{region.region}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{region.businesses} empresas</span>
                    <span>{region.users.toLocaleString()} usuarios</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">${(region.revenue / 1000000).toFixed(1)}M</div>
                  <div className="text-xs text-muted-foreground">ingresos</div>
                </div>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden ml-4">
                  <div className="h-full bg-primary" style={{ width: `${(region.revenue / 125000000) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Churn Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Churn</CardTitle>
          <CardDescription>Nuevas empresas vs empresas que cancelaron</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={churnAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="newBusinesses" stackId="1" stroke="#059669" fill="#059669" name="Nuevas" />
              <Area
                type="monotone"
                dataKey="churnedBusinesses"
                stackId="2"
                stroke="#DC2626"
                fill="#DC2626"
                name="Canceladas"
              />
              <Area
                type="monotone"
                dataKey="netGrowth"
                stackId="3"
                stroke="#7A8B5A"
                fill="#7A8B5A"
                name="Crecimiento Neto"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ingresos por Plan</CardTitle>
            <CardDescription>Contribución de cada plan al MRR total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {planAdoption.map((plan, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: plan.color }} />
                    <span className="font-medium">{plan.plan}</span>
                    <span className="text-sm text-muted-foreground">({plan.count} empresas)</span>
                  </div>
                  <span className="font-bold">${(plan.revenue / 1000000).toFixed(1)}M</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas de Rendimiento</CardTitle>
            <CardDescription>KPIs clave de la plataforma</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">ARPU (Ingreso por Usuario)</span>
                <span className="font-bold">${Math.round((globalKPIs.platformRevenue || 0) / Math.max(globalKPIs.totalUsers || 1, 1))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tasa de Conversión Global</span>
                <span className="font-bold">4.8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Churn Rate Mensual</span>
                <span className="font-bold">2.3%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">LTV/CAC Ratio</span>
                <span className="font-bold">3.2x</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
