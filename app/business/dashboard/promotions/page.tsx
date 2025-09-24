"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Search, Filter, Eye, Edit, Copy, CalendarIcon, Star, MoreHorizontal, Crown } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getCurrentUser } from "@/lib/auth"

// Mock data
const mockPromotions = [
  {
    id: "1",
    title: "Descuento 20% en Almuerzo Ejecutivo",
    description: "Válido de lunes a viernes hasta las 3 PM",
    type: "percentage",
    value: 20,
    status: "active",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-02-01"),
    views: 2400,
    saves: 180,
    redemptions: 134,
    featured: true,
  },
  {
    id: "2",
    title: "2x1 en Bebidas Calientes",
    description: "Aplica para café, té y chocolate caliente",
    type: "bogo",
    value: 0,
    status: "active",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-01-31"),
    views: 1800,
    saves: 120,
    redemptions: 89,
    featured: false,
  },
  {
    id: "3",
    title: "Envío Gratis en Pedidos",
    description: "Sin mínimo de compra, válido para toda la ciudad",
    type: "free_shipping",
    value: 0,
    status: "draft",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-02-28"),
    views: 0,
    saves: 0,
    redemptions: 0,
    featured: false,
  },
]

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState(mockPromotions)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPromotion, setNewPromotion] = useState({
    title: "",
    description: "",
    type: "percentage",
    value: 0,
    startDate: new Date(),
    endDate: new Date(),
    digitalCardEligible: false,
  })

  const user = getCurrentUser("business") as any
  const plan = user?.plan || "gratis"
  const isPremium = plan === "pro" || plan === "enterprise"

  const filteredPromotions = promotions.filter((promo) => {
    const matchesSearch = promo.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || promo.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      draft: "secondary",
      expired: "destructive",
    } as const

    const labels = {
      active: "Activa",
      draft: "Borrador",
      expired: "Expirada",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const getPromotionLimits = () => {
    switch (plan) {
      case "gratis":
        return { active: 1, monthly: 1 }
      case "basico":
        return { active: 3, monthly: 3 }
      default:
        return { active: Number.POSITIVE_INFINITY, monthly: Number.POSITIVE_INFINITY }
    }
  }

  const limits = getPromotionLimits()
  const activeCount = promotions.filter((p) => p.status === "active").length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promociones</h1>
          <p className="text-muted-foreground">Gestiona tus ofertas y descuentos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {activeCount}/{limits.active === Number.POSITIVE_INFINITY ? "∞" : limits.active} promociones activas
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={activeCount >= limits.active}>
                <Plus className="h-4 w-4 mr-1" />
                Nueva Promoción
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nueva Promoción</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Título de la promoción</Label>
                    <Input
                      id="title"
                      placeholder="Ej: Descuento 20% en almuerzo"
                      value={newPromotion.title}
                      onChange={(e) => setNewPromotion((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de promoción</Label>
                    <Select
                      value={newPromotion.type}
                      onValueChange={(value) => setNewPromotion((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Descuento porcentual</SelectItem>
                        <SelectItem value="fixed">Descuento fijo</SelectItem>
                        <SelectItem value="bogo">2x1 / BOGO</SelectItem>
                        <SelectItem value="free_shipping">Envío gratis</SelectItem>
                        <SelectItem value="flash_deal">Oferta flash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe los términos y condiciones de la promoción..."
                    value={newPromotion.description}
                    onChange={(e) => setNewPromotion((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                {(newPromotion.type === "percentage" || newPromotion.type === "fixed") && (
                  <div className="space-y-2">
                    <Label htmlFor="value">Valor {newPromotion.type === "percentage" ? "(%)" : "(COP)"}</Label>
                    <Input
                      id="value"
                      type="number"
                      placeholder={newPromotion.type === "percentage" ? "20" : "10000"}
                      value={newPromotion.value}
                      onChange={(e) => setNewPromotion((prev) => ({ ...prev, value: Number(e.target.value) }))}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de inicio</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(newPromotion.startDate, "PPP", { locale: es })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newPromotion.startDate}
                          onSelect={(date) => date && setNewPromotion((prev) => ({ ...prev, startDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha de fin</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left bg-transparent">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(newPromotion.endDate, "PPP", { locale: es })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newPromotion.endDate}
                          onSelect={(date) => date && setNewPromotion((prev) => ({ ...prev, endDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="digital-card"
                    checked={newPromotion.digitalCardEligible}
                    onCheckedChange={(checked) =>
                      setNewPromotion((prev) => ({ ...prev, digitalCardEligible: checked }))
                    }
                  />
                  <Label htmlFor="digital-card">Elegible para tarjeta digital</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setIsCreateDialogOpen(false)}>Crear Promoción</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Featured Section for Premium Plans */}
      {isPremium && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="h-5 w-5 mr-2 text-primary" />
              Promociones Destacadas
            </CardTitle>
            <CardDescription>Tus promociones aparecen en la sección destacada para mayor visibilidad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {promotions
                .filter((p) => p.featured)
                .map((promo) => (
                  <div key={promo.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{promo.title}</h4>
                      <p className="text-sm text-muted-foreground">{promo.views} vistas</p>
                    </div>
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar promociones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="draft">Borradores</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Promotions List */}
      <div className="space-y-4">
        {filteredPromotions.map((promo) => (
          <Card key={promo.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{promo.title}</h3>
                    {getStatusBadge(promo.status)}
                    {promo.featured && <Star className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-muted-foreground mb-4">{promo.description}</p>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {promo.views} vistas
                    </span>
                    <span>{promo.saves} guardadas</span>
                    <span>{promo.redemptions} redenciones</span>
                    <span>
                      {format(promo.startDate, "dd/MM/yyyy")} - {format(promo.endDate, "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPromotions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No se encontraron promociones</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Crea tu primera promoción para comenzar"}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Crear Primera Promoción
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
