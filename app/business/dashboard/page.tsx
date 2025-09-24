"use client"

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
import { getCurrentUser } from "@/lib/auth"
import Link from "next/link"

// Mock data
const impressionsData = [
  { name: "Lun", impressions: 1200, views: 800, redemptions: 45 },
  { name: "Mar", impressions: 1900, views: 1200, redemptions: 67 },
  { name: "Mié", impressions: 800, views: 600, redemptions: 32 },
  { name: "Jue", impressions: 2400, views: 1800, redemptions: 89 },
  { name: "Vie", impressions: 3200, views: 2400, redemptions: 134 },
  { name: "Sáb", impressions: 2800, views: 2100, redemptions: 112 },
  { name: "Dom", impressions: 1600, views: 1100, redemptions: 78 },
]

const topPromotions = [
  { name: "Descuento 20% Almuerzo", views: 2400, redemptions: 134, conversion: 5.6 },
  { name: "2x1 en Bebidas", views: 1800, redemptions: 89, conversion: 4.9 },
  { name: "Envío Gratis", views: 1200, redemptions: 67, conversion: 5.6 },
  { name: "Descuento Estudiantes", views: 800, redemptions: 45, conversion: 5.6 },
]

const funnelData = [
  { name: "Impresiones", value: 12000, color: "#7A8B5A" },
  { name: "Vistas", value: 8400, color: "#1E3A8A" },
  { name: "Guardadas", value: 2100, color: "#059669" },
  { name: "Redenciones", value: 557, color: "#DC2626" },
]

export default function BusinessDashboardPage() {
  const user = getCurrentUser("business") as any
  const plan = user?.plan || "gratis"
  const isPremium = plan === "pro" || plan === "enterprise"

  const getKPIsByPlan = () => {
    const baseKPIs = [
      { title: "Promociones Activas", value: "8", icon: ShoppingCart, change: "+2 esta semana" },
      { title: "Total Impresiones", value: "12,400", icon: Eye, change: "+15% vs mes anterior" },
      { title: "Total Redenciones", value: "557", icon: MousePointer, change: "+8% vs mes anterior" },
    ]

    if (isPremium) {
      return [
        ...baseKPIs,
        { title: "Tasa de Conversión", value: "4.5%", icon: TrendingUp, change: "+0.3% vs mes anterior" },
      ]
    }

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
              <Link href="/business/dashboard/billing">
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
            Estás en el plan gratuito. Publica promociones por $10,000 COP cada una o{" "}
            <Link href="/business/dashboard/billing" className="text-primary hover:underline">
              actualiza tu plan
            </Link>{" "}
            para acceso ilimitado.
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
            {topPromotions.map((promo, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{promo.name}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{promo.views} vistas</span>
                    <span>{promo.redemptions} redenciones</span>
                    {isPremium && <span>{promo.conversion}% conversión</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-primary">{promo.redemptions}</div>
                  <div className="text-xs text-muted-foreground">redenciones</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próxima Renovación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">15</p>
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
                <p className="text-2xl font-bold">8{plan === "gratis" ? "/1" : plan === "basico" ? "/3" : "/∞"}</p>
                <p className="text-sm text-muted-foreground">activas este mes</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress value={plan === "gratis" ? 100 : plan === "basico" ? 80 : 30} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
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
        </Card>
      </div>
    </div>
  )
}
