"use client"

import { useState } from "react"
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
import Link from "next/link"
import { Promotion, BusinessAnalytics } from "@/lib/types"

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

const funnelData = [
  { name: "Impresiones", value: 12000, color: "#7A8B5A" },
  { name: "Vistas", value: 8400, color: "#1E3A8A" },
  { name: "Guardadas", value: 2100, color: "#059669" },
  { name: "Redenciones", value: 557, color: "#DC2626" },
]

export default function BusinessDashboardPage() {
  const { user } = useAuth()
  const [topPromotions, setTopPromotions] = useState<Promotion[]>([])
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([])
  const [analytics, setAnalytics] = useState<BusinessAnalytics>()
  const businessUser = user as any
  const plan = businessUser?.plan || "gratis"
  const isPremium = plan === "pro" || plan === "enterprise"

  const getKPIsByPlan = () => {
    const baseKPIs = [
      { title: "Promociones Activas", value: activePromotions.length, icon: ShoppingCart, change: "+2 esta semana" },
      { title: "Total Impresiones", value: analytics?.totalImpressions || 0, icon: Eye, change: "+15% vs mes anterior" },
      { title: "Total vistas", value: analytics?.totalViews || 0, icon: TrendingUp, change: "+8% vs mes anterior" },
      { title: "Guardado en favoritos", value: analytics?.totalSaves || 0, icon: MousePointer, change: "+8% vs mes anterior" },
    ]

    // if (isPremium) {
    //   return [
    //     ...baseKPIs,
    //     { title: "Tasa de Conversión", value: "4.5%", icon: TrendingUp, change: "+0.3% vs mes anterior" },
    //   ]
    // }

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
            {topPromotions.length ? topPromotions.map((promo, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{promo.title}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{promo.views_count} vistas</span>
                    <span>{promo.saves_count} guardadas</span>
                    <span>{promo.redemptions_count} redenciones</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-primary">{promo.redemptions_count}</div>
                  <div className="text-xs text-muted-foreground">redenciones</div>
                </div>
              </div>
            )) : (
              <div className="text-xs text-muted-foreground">No tienes promociones todavia</div>
            )}
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
                <p className="text-2xl font-bold">{activePromotions.length}{plan === "gratis" ? "/1" : plan === "basico" ? "/3" : plan === "pro" ? "/10" : "/∞"}</p>
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
