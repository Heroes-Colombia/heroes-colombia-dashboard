"use client"

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

// Mock data
const platformKPIs = [
  { title: "Total Empresas", value: "1,247", change: "+12%", icon: Building2, trend: "up" },
  { title: "Usuarios Activos", value: "45,678", change: "+8%", icon: Users, trend: "up" },
  { title: "Promociones Activas", value: "3,456", change: "+15%", icon: Tag, trend: "up" },
  { title: "Ingresos MRR", value: "$287M", change: "+23%", icon: DollarSign, trend: "up" },
]

const businessesByTier = [
  { name: "Gratis", value: 623, color: "#94A3B8" },
  { name: "Básico", value: 312, color: "#7A8B5A" },
  { name: "Pro", value: 234, color: "#1E3A8A" },
  { name: "Enterprise", value: 78, color: "#059669" },
]

const monthlyGrowth = [
  { month: "Ene", businesses: 980, users: 38000, revenue: 220 },
  { month: "Feb", businesses: 1050, users: 41000, revenue: 245 },
  { month: "Mar", businesses: 1120, users: 43500, revenue: 267 },
  { month: "Apr", businesses: 1180, users: 44800, revenue: 278 },
  { month: "May", businesses: 1247, users: 45678, revenue: 287 },
]

const topBusinesses = [
  { name: "Restaurante El Dorado", plan: "Enterprise", revenue: 45000, redemptions: 1234 },
  { name: "Tienda Fashion Plus", plan: "Pro", revenue: 32000, redemptions: 987 },
  { name: "Café Central", plan: "Pro", revenue: 28000, redemptions: 756 },
  { name: "Supermercado Familiar", plan: "Enterprise", revenue: 52000, redemptions: 1456 },
  { name: "Librería Académica", plan: "Básico", revenue: 15000, redemptions: 234 },
]

const verificationStats = [
  { title: "Verificaciones Exitosas", value: "94.2%", icon: CheckCircle, color: "text-green-600" },
  { title: "Verificaciones Fallidas", value: "5.8%", icon: XCircle, color: "text-red-600" },
  { title: "Pendientes de Revisión", value: "127", icon: Clock, color: "text-yellow-600" },
]

const geoData = [
  { city: "Bogotá", businesses: 456, users: 18234 },
  { city: "Medellín", businesses: 234, users: 9876 },
  { city: "Cali", businesses: 189, users: 7654 },
  { city: "Barranquilla", businesses: 123, users: 4567 },
  { city: "Cartagena", businesses: 98, users: 3456 },
]

export default function AdminDashboardPage() {
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
        {/* Growth Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Crecimiento de la Plataforma</CardTitle>
            <CardDescription>Evolución mensual de empresas, usuarios e ingresos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="businesses" stroke="#7A8B5A" strokeWidth={2} name="Empresas" />
                <Line type="monotone" dataKey="users" stroke="#1E3A8A" strokeWidth={2} name="Usuarios" />
              </LineChart>
            </ResponsiveContainer>
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
              {topBusinesses.map((business, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{business.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={business.plan === "Enterprise" ? "default" : "secondary"} className="text-xs">
                        {business.plan}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{business.redemptions} redenciones</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">${business.revenue.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">ingresos</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Distribución Geográfica
            </CardTitle>
            <CardDescription>Empresas y usuarios por ciudad</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={geoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="city" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="businesses" fill="#7A8B5A" name="Empresas" />
                <Bar dataKey="users" fill="#1E3A8A" name="Usuarios" />
              </BarChart>
            </ResponsiveContainer>
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
              <p className="text-2xl font-bold text-primary">23</p>
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
              <p className="text-2xl font-bold text-secondary">127</p>
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
              <p className="text-2xl font-bold text-green-600">45</p>
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
              <p className="text-2xl font-bold text-orange-600">12</p>
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
