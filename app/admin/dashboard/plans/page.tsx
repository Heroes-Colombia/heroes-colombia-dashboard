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
import { Textarea } from "@/components/ui/textarea"
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
  Plus,
  Download,
  TrendingUp,
  Star,
  Zap,
} from "lucide-react"
import type { PlanType, PlanConfiguration } from "@/lib/types"

// Mock data for plan configurations
const mockPlans: PlanConfiguration[] = [
  {
    id: "gratis",
    name: "Plan Gratuito",
    price: 0,
    currency: "COP",
    billingCycle: "monthly",
    maxLocations: 1,
    maxPromotions: 2,
    maxTeamMembers: 1,
    features: {
      basicAnalytics: true,
      advancedAnalytics: false,
      enterpriseAnalytics: false,
      teamManagement: false,
      priorityListings: false,
      featuredPromotions: false,
      apiAccess: false,
      customCampaigns: false,
      dedicatedManager: false,
    },
    analyticsLevel: "basic",
    supportLevel: "email",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "basico",
    name: "Plan Básico",
    price: 50000,
    currency: "COP",
    billingCycle: "monthly",
    maxLocations: 3,
    maxPromotions: 10,
    maxTeamMembers: 3,
    features: {
      basicAnalytics: true,
      advancedAnalytics: false,
      enterpriseAnalytics: false,
      teamManagement: true,
      priorityListings: false,
      featuredPromotions: false,
      apiAccess: false,
      customCampaigns: false,
      dedicatedManager: false,
    },
    analyticsLevel: "basic",
    supportLevel: "email",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "pro",
    name: "Plan Pro",
    price: 150000,
    currency: "COP",
    billingCycle: "monthly",
    maxLocations: 10,
    maxPromotions: 50,
    maxTeamMembers: 10,
    features: {
      basicAnalytics: true,
      advancedAnalytics: true,
      enterpriseAnalytics: false,
      teamManagement: true,
      priorityListings: true,
      featuredPromotions: true,
      apiAccess: false,
      customCampaigns: true,
      dedicatedManager: false,
    },
    analyticsLevel: "advanced",
    supportLevel: "email_chat",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "enterprise",
    name: "Plan Enterprise",
    price: 500000,
    currency: "COP",
    billingCycle: "monthly",
    maxLocations: "unlimited",
    maxPromotions: "unlimited",
    maxTeamMembers: "unlimited",
    features: {
      basicAnalytics: true,
      advancedAnalytics: true,
      enterpriseAnalytics: true,
      teamManagement: true,
      priorityListings: true,
      featuredPromotions: true,
      apiAccess: true,
      customCampaigns: true,
      dedicatedManager: true,
    },
    analyticsLevel: "enterprise",
    supportLevel: "dedicated",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
  },
]


export default function AdminPlansPage() {
  const { businesses, isLoading } = useBusinesses()
  const [plans, setPlans] = useState(mockPlans)
  const [selectedPlan, setSelectedPlan] = useState<PlanConfiguration | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<PlanConfiguration>>({})

  // Calculate real subscription stats from businesses
  const subscriptionStats = {
    gratis: {
      count: businesses.filter(b => !b.plan || b.plan === "gratis").length,
      revenue: 0,
      growth: "+0%"
    },
    basico: {
      count: businesses.filter(b => b.plan === "basico").length,
      revenue: businesses.filter(b => b.plan === "basico").length * 50000,
      growth: "+0%"
    },
    pro: {
      count: businesses.filter(b => b.plan === "pro").length,
      revenue: businesses.filter(b => b.plan === "pro").length * 150000,
      growth: "+0%"
    },
    enterprise: {
      count: businesses.filter(b => b.plan === "enterprise").length,
      revenue: businesses.filter(b => b.plan === "enterprise").length * 500000,
      growth: "+0%"
    },
  }

  const handleEditPlan = (plan: PlanConfiguration) => {
    setSelectedPlan(plan)
    setEditForm(plan)
    setIsEditing(true)
  }

  const handleSavePlan = () => {
    if (!selectedPlan || !editForm.id) return

    setPlans(prev => prev.map(p =>
      p.id === selectedPlan.id
        ? { ...p, ...editForm, updatedAt: new Date() } as PlanConfiguration
        : p
    ))
    setIsEditing(false)
    setSelectedPlan(null)
    setEditForm({})
  }

  const handleTogglePlanStatus = (planId: PlanType) => {
    setPlans(prev => prev.map(p =>
      p.id === planId ? { ...p, isActive: !p.isActive, updatedAt: new Date() } : p
    ))
  }

  const getPlanIcon = (planId: PlanType) => {
    switch (planId) {
      case "gratis":
        return <Users className="h-5 w-5" />
      case "basico":
        return <MapPin className="h-5 w-5" />
      case "pro":
        return <Star className="h-5 w-5 text-yellow-500" />
      case "enterprise":
        return <Crown className="h-5 w-5 text-purple-500" />
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

  const formatLimitValue = (value: number | "unlimited") => {
    return value === "unlimited" ? "Ilimitado" : value.toString()
  }

  const exportPlansReport = () => {
    const csvContent = [
      "Plan,Precio,Suscriptores,Ingresos,Ubicaciones Máx,Promociones Máx,Equipo Máx,Estado",
      ...plans.map(plan => {
        const stats = subscriptionStats[plan.id as keyof typeof subscriptionStats]
        return `"${plan.name}",${plan.price},${stats?.count || 0},${stats?.revenue || 0},${formatLimitValue(plan.maxLocations)},${formatLimitValue(plan.maxPromotions)},${formatLimitValue(plan.maxTeamMembers)},"${plan.isActive ? 'Activo' : 'Inactivo'}"`
      })
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "reporte_planes_heroes_colombia.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const totalRevenue = Object.values(subscriptionStats).reduce((sum, stat) => sum + (stat?.revenue || 0), 0)
  const totalSubscribers = Object.values(subscriptionStats).reduce((sum, stat) => sum + (stat?.count || 0), 0)

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
          <p className="text-muted-foreground">Administra los planes de suscripción y configuraciones</p>
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
        {Object.entries(subscriptionStats).map(([planId, stats]) => {
          const plan = plans.find(p => p.id === planId)
          if (!plan) return null

          return (
            <Card key={planId}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getPlanIcon(planId as PlanType)}
                    <span className="font-medium text-sm">{plan.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {stats?.growth || "+0%"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold">
                    {(stats?.count || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPrice(stats?.revenue || 0)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Plans Management */}
      <div className="grid gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className={!plan.isActive ? "opacity-60" : ""}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getPlanIcon(plan.id)}
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {plan.name}
                      {!plan.isActive && <Badge variant="secondary">Inactivo</Badge>}
                      {plan.id === "pro" && <Star className="h-4 w-4 text-yellow-500" />}
                      {plan.id === "enterprise" && <Crown className="h-4 w-4 text-purple-500" />}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold">{formatPrice(plan.price)}</span>
                      <span className="text-sm text-muted-foreground">/{plan.billingCycle === "monthly" ? "mes" : "año"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-4">
                    <div className="text-lg font-semibold">
                      {(subscriptionStats[plan.id as keyof typeof subscriptionStats]?.count || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">suscriptores</div>
                  </div>
                  <Switch
                    checked={plan.isActive}
                    onCheckedChange={() => handleTogglePlanStatus(plan.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditPlan(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">{formatLimitValue(plan.maxLocations)}</span> ubicaciones
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">{formatLimitValue(plan.maxPromotions)}</span> promociones
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">{formatLimitValue(plan.maxTeamMembers)}</span> miembros
                  </span>
                </div>
              </div>

              {/* Features */}
              <div>
                <h4 className="font-medium mb-2 text-sm">Características</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    {plan.features.basicAnalytics ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                    <span className="text-xs">Analíticas básicas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.features.advancedAnalytics ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                    <span className="text-xs">Analíticas avanzadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.features.teamManagement ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                    <span className="text-xs">Gestión de equipo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.features.featuredPromotions ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                    <span className="text-xs">Promociones destacadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.features.priorityListings ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                    <span className="text-xs">Listados prioritarios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.features.apiAccess ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-red-600" />}
                    <span className="text-xs">Acceso API</span>
                  </div>
                </div>
              </div>

              {/* Support & Analytics */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span>Analíticas: <span className="font-medium">{plan.analyticsLevel}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Soporte: <span className="font-medium">{plan.supportLevel.replace("_", " + ")}</span></span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Plan: {selectedPlan?.name}</DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del Plan</Label>
                  <Input
                    id="name"
                    value={editForm.name || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Precio (COP)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={editForm.price || 0}
                    onChange={(e) => setEditForm(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="maxLocations">Ubicaciones Máximas</Label>
                  <Input
                    id="maxLocations"
                    value={editForm.maxLocations === "unlimited" ? "unlimited" : editForm.maxLocations?.toString() || ""}
                    onChange={(e) => {
                      const value = e.target.value
                      setEditForm(prev => ({
                        ...prev,
                        maxLocations: value === "unlimited" ? "unlimited" : parseInt(value) || 1
                      }))
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="maxPromotions">Promociones Máximas</Label>
                  <Input
                    id="maxPromotions"
                    value={editForm.maxPromotions === "unlimited" ? "unlimited" : editForm.maxPromotions?.toString() || ""}
                    onChange={(e) => {
                      const value = e.target.value
                      setEditForm(prev => ({
                        ...prev,
                        maxPromotions: value === "unlimited" ? "unlimited" : parseInt(value) || 1
                      }))
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="maxTeamMembers">Miembros de Equipo Máx</Label>
                  <Input
                    id="maxTeamMembers"
                    value={editForm.maxTeamMembers === "unlimited" ? "unlimited" : editForm.maxTeamMembers?.toString() || ""}
                    onChange={(e) => {
                      const value = e.target.value
                      setEditForm(prev => ({
                        ...prev,
                        maxTeamMembers: value === "unlimited" ? "unlimited" : parseInt(value) || 1
                      }))
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="analyticsLevel">Nivel de Analíticas</Label>
                  <Select
                    value={editForm.analyticsLevel || "basic"}
                    onValueChange={(value: "basic" | "advanced" | "enterprise") =>
                      setEditForm(prev => ({ ...prev, analyticsLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="advanced">Avanzado</SelectItem>
                      <SelectItem value="enterprise">Empresarial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="supportLevel">Nivel de Soporte</Label>
                  <Select
                    value={editForm.supportLevel || "email"}
                    onValueChange={(value: "email" | "email_chat" | "dedicated") =>
                      setEditForm(prev => ({ ...prev, supportLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="email_chat">Email + Chat</SelectItem>
                      <SelectItem value="dedicated">Dedicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Características</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {Object.entries(editForm.features || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) =>
                          setEditForm(prev => ({
                            ...prev,
                            features: { ...prev.features, [key]: checked }
                          }))
                        }
                      />
                      <Label htmlFor={key} className="text-sm">
                        {key.replace(/([A-Z])/g, " $1").toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSavePlan}>
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  )
}