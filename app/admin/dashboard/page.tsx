"use client"

import { useBusinesses } from "@/hooks/use-businesses"
import { usePromotions } from "@/hooks/use-promotions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
} from "recharts"
import {
  Building2,
  Users,
  Tag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
} from "lucide-react"
import Link from "next/link"

export default function AdminDashboardPage() {
  const { businesses, isLoading: businessesLoading } = useBusinesses()
  const { promotions, isLoading: promotionsLoading } = usePromotions()

  // Calculate real-time stats
  const totalBusinesses = businesses?.length
  const approvedBusinesses = businesses?.filter(b => b.status === "approved" || b.status === "active").length
  const pendingBusinesses = businesses?.filter(b => b.status === "pending").length
  const suspendedBusinesses = businesses?.filter(b => b.status === "suspended").length

  const totalPromotions = promotions?.length
  const activePromotions = promotions?.filter(p => p.status === "active").length
  const inactivePromotions = promotions?.filter(p => p.status === "inactive").length

  // Calculate business distribution by plan
  const planDistribution = businesses?.reduce((acc, business) => {
    const plan = business.plan || "gratis"
    acc[plan] = (acc[plan] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const businessesByTier = [
    { name: "Gratis", value: planDistribution.gratis || 0, color: "#94A3B8" },
    { name: "Básico", value: planDistribution.basico || 0, color: "#7A8B5A" },
    { name: "Pro", value: planDistribution.pro || 0, color: "#1E3A8A" },
    { name: "Enterprise", value: planDistribution.enterprise || 0, color: "#059669" },
  ]

  // Calculate platform KPIs with real data
  const platformKPIs = [
    { title: "Total Empresas", value: totalBusinesses?.toString() || "0", change: "+0%", icon: Building2, trend: "up" as const },
    { title: "Empresas Aprobadas", value: approvedBusinesses?.toString() || "0", change: "+0%", icon: CheckCircle, trend: "up" as const },
    { title: "Promociones Activas", value: activePromotions?.toString() || "0", change: "+0%", icon: Tag, trend: "up" as const },
    { title: "Total Promociones", value: totalPromotions?.toString() || "0", change: "+0%", icon: DollarSign, trend: "up" as const },
  ]

  // Verification stats with real data
  const verificationStats = [
    { title: "Empresas Aprobadas", value: approvedBusinesses?.toString() || "0", icon: CheckCircle, color: "text-green-600" },
    { title: "Empresas Suspendidas", value: suspendedBusinesses.toString(), icon: XCircle, color: "text-red-600" },
    { title: "Pendientes de Revisión", value: pendingBusinesses.toString(), icon: Clock, color: "text-yellow-600" },
  ]

  // Top businesses based on real data (sorted by creation date for now)
  const topBusinesses = businesses
    .filter(b => b.status === "approved" || b.status === "active")
    .slice(0, 5)
    .map(business => ({
      name: business.name,
      plan: business.plan || "gratis",
      id: business.id,
      status: business.status
    }))

  if (businessesLoading || promotionsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Cargando datos del dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Panel General</h1>
          <p className="text-muted-foreground">Resumen ejecutivo de la plataforma Héroes Colombia</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Sistema Operativo
          </Badge>
        </div>
      </div>

      {/* Platform KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {platformKPIs.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <div className="flex items-center text-xs">
                {kpi.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
                )}
                <span className={kpi.trend === "up" ? "text-green-600" : "text-red-600"}>{kpi.change}</span>
                <span className="text-muted-foreground ml-1">vs mes anterior</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Business Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Empresas</CardTitle>
            <CardDescription>Distribución actual por estado de verificación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{approvedBusinesses}</div>
                  <div className="text-sm text-green-600">Aprobadas</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{pendingBusinesses}</div>
                  <div className="text-sm text-yellow-600">Pendientes</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{suspendedBusinesses}</div>
                  <div className="text-sm text-red-600">Suspendidas</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Planes</CardTitle>
            <CardDescription>Empresas registradas por tipo de suscripción</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={businessesByTier}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {businessesByTier.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Verification Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {verificationStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Businesses and Geographic Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Performing Businesses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Empresas Destacadas</CardTitle>
              <CardDescription>Top 5 por engagement y ingresos</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/admin/dashboard/businesses">Ver Todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topBusinesses.length > 0 ? topBusinesses.map((business, index) => (
                <div key={business.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{business.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={business.plan === "enterprise" || business.plan === "pro" ? "default" : "secondary"} className="text-xs">
                        {business.plan}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {business.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">#{index + 1}</div>
                    <div className="text-xs text-muted-foreground">posición</div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay empresas aprobadas aún</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Promotion Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Tag className="h-5 w-5 mr-2" />
              Estado de Promociones
            </CardTitle>
            <CardDescription>Distribución de promociones por estado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{activePromotions}</div>
                  <div className="text-sm text-blue-600">Activas</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{inactivePromotions}</div>
                  <div className="text-sm text-gray-600">Inactivas</div>
                </div>
              </div>
              <div className="text-center pt-2">
                <div className="text-lg font-medium">Total: {totalPromotions} promociones</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-medium mb-1">Empresas Pendientes</h3>
              <p className="text-2xl font-bold text-primary">{pendingBusinesses}</p>
              <Button variant="outline" size="sm" className="mt-2 bg-transparent" asChild>
                <Link href="/admin/dashboard/businesses">Revisar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-secondary" />
              <h3 className="font-medium mb-1">Verificaciones</h3>
              <p className="text-2xl font-bold text-secondary">{pendingBusinesses}</p>
              <Button variant="outline" size="sm" className="mt-2 bg-transparent" asChild>
                <Link href="/admin/dashboard/users">Procesar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Tag className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium mb-1">Promociones</h3>
              <p className="text-2xl font-bold text-green-600">{activePromotions}</p>
              <Button variant="outline" size="sm" className="mt-2 bg-transparent" asChild>
                <Link href="/admin/dashboard/promotions">Moderar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <h3 className="font-medium mb-1">Reportes</h3>
              <p className="text-2xl font-bold text-orange-600">{totalBusinesses}</p>
              <Button variant="outline" size="sm" className="mt-2 bg-transparent" asChild>
                <Link href="/admin/dashboard/analytics">Generar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
