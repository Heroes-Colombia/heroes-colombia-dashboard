"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Filter, Eye, Edit, Copy, CalendarIcon, Star, MoreHorizontal, ShoppingCart, AlertCircle, MapPin, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getCurrentUser } from "@/lib/auth"
import { getPlanLimits, canAddPromotion, EXTRA_PROMOTION_PRICE } from "@/lib/plan-limits"
import { PlanLimitBadge, PlanLimitProgress } from "@/components/plan-limit-badge"
import { UpgradePlanButton } from "@/components/upgrade-plan-button"
import { LockedFeature } from "@/components/locked-feature"
import { PromotionService } from "@/lib/services/promotion-service"
import { LocationService } from "@/lib/services/location-service"
import type { Promotion, PlanType, BusinessLocation } from "@/lib/types"

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false)
  const [purchaseQuantity, setPurchaseQuantity] = useState(1)
  const [newPromotion, setNewPromotion] = useState({
    title: "",
    description: "",
    instructions: "",
    percentage: 0,
    locationIds: [] as string[],
    expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  })

  const user = getCurrentUser() as any
  const plan: PlanType = user?.plan || "gratis"
  const limits = getPlanLimits(plan)
  const businessId = user?.businessId

  // Mock business data (would come from Firestore)
  const extraPromotionsPurchased = 0
  const extraPromotionsActive = 0

  // Fetch promotions and locations from Firebase
  useEffect(() => {
    const fetchData = async () => {
      if (!businessId) return

      setIsLoading(true)
      try {
        const [fetchedPromotions, fetchedLocations] = await Promise.all([
          PromotionService.getPromotions({ businessId }),
          LocationService.getBusinessLocations(businessId)
        ])

        setPromotions(fetchedPromotions)
        setLocations(fetchedLocations)
      } catch (error) {
        console.error("Error fetching data:", error)
        alert("Error: No se pudieron cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [businessId])

  const filteredPromotions = promotions.filter((promo) => {
    const matchesSearch = promo.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || promo.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Count active promotions (per business, not per location - Schema V2)
  const activeCount = promotions.filter((p) => p.status === "active").length

  // Check if can add promotion
  const addPromotionCheck = canAddPromotion(plan, activeCount, extraPromotionsPurchased)

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      draft: "secondary",
      pending: "outline",
      inactive: "destructive",
      expired: "destructive",
    } as const

    const labels = {
      active: "Activa",
      draft: "Borrador",
      pending: "Pendiente",
      inactive: "Inactiva",
      expired: "Expirada",
    }

    return <Badge variant={variants[status as keyof typeof variants] || "outline"}>{labels[status as keyof typeof labels] || status}</Badge>
  }

  const getLocationNames = (locationIds: string[]) => {
    if (locationIds.length === 0) return "Todas las ubicaciones"

    const names = locationIds
      .map((id) => locations.find((loc) => loc.id === id)?.name)
      .filter(Boolean)

    return names.join(", ")
  }

  const handlePurchaseExtraPromotions = () => {
    // TODO: Integrate with MercadoPago
    console.log(`Purchasing ${purchaseQuantity} extra promotions for ${purchaseQuantity * EXTRA_PROMOTION_PRICE} COP`)
    setIsPurchaseDialogOpen(false)
  }

  const handleCreatePromotion = async () => {
    if (!businessId) return

    const promotionData = {
      business_id: businessId,
      title: newPromotion.title,
      description: newPromotion.description,
      instructions: newPromotion.instructions,
      percentage: newPromotion.percentage,
      featured_image: "", // TODO: Add image upload
      location_ids: newPromotion.locationIds,
      expired_at: newPromotion.expiredAt,
      status: "draft",
      is_featured: false,
      views_count: 0,
      saves_count: 0,
      redemptions_count: 0,
    }

    try {
      const promotionId = await PromotionService.createPromotion(promotionData)

      if (promotionId) {
        // Refresh promotions
        const fetchedPromotions = await PromotionService.getPromotions({ businessId })
        setPromotions(fetchedPromotions)

        alert("Promoción creada exitosamente")
        setIsCreateDialogOpen(false)

        // Reset form
        setNewPromotion({
          title: "",
          description: "",
          instructions: "",
          percentage: 0,
          locationIds: [],
          expiredAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
      }
    } catch (error) {
      console.error("Error creating promotion:", error)
      alert("Error: No se pudo crear la promoción")
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando promociones...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promociones</h1>
          <p className="text-muted-foreground">Gestiona tus ofertas y descuentos</p>
        </div>
        <div className="flex items-center gap-4">
          <PlanLimitBadge
            plan={plan}
            resourceType="promotions"
            currentCount={activeCount}
            extraPurchased={extraPromotionsPurchased}
            showIcon
          />
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!addPromotionCheck.canAdd && !addPromotionCheck.requiresPayment}>
                <Plus className="h-4 w-4 mr-1" />
                Nueva Promoción
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Promoción</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Plan Gratis - Pay per promotion notice */}
                {plan === "gratis" && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Plan Gratis - Pago por promoción</p>
                        <p className="text-sm text-blue-700">
                          Cada promoción activa cuesta ${EXTRA_PROMOTION_PRICE.toLocaleString()} COP/mes
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Título de la promoción *</Label>
                  <Input
                    id="title"
                    placeholder="Ej: Descuento 20% en almuerzo"
                    value={newPromotion.title}
                    onChange={(e) => setNewPromotion((prev) => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe los términos y condiciones de la promoción..."
                    value={newPromotion.description}
                    onChange={(e) => setNewPromotion((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Instrucciones de redención *</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Ej: Presenta tu identificación militar al momento de ordenar"
                    value={newPromotion.instructions}
                    onChange={(e) => setNewPromotion((prev) => ({ ...prev, instructions: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="percentage">Porcentaje de descuento *</Label>
                  <Input
                    id="percentage"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="20"
                    value={newPromotion.percentage}
                    onChange={(e) => setNewPromotion((prev) => ({ ...prev, percentage: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground">Valor entre 0 y 100</p>
                </div>

                <div className="space-y-2">
                  <Label>Fecha de expiración *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left bg-transparent">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(newPromotion.expiredAt, "PPP", { locale: es })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newPromotion.expiredAt}
                        onSelect={(date) => date && setNewPromotion((prev) => ({ ...prev, expiredAt: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Location Targeting */}
                <div className="space-y-3">
                  <Label>Ubicaciones donde aplica</Label>
                  <p className="text-xs text-muted-foreground">Deja sin seleccionar para aplicar en todas las ubicaciones</p>
                  <div className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="all-locations"
                        checked={newPromotion.locationIds.length === 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewPromotion((prev) => ({ ...prev, locationIds: [] }))
                          }
                        }}
                      />
                      <label htmlFor="all-locations" className="text-sm font-medium">
                        Todas las ubicaciones
                      </label>
                    </div>
                    {locations.map((location) => (
                      <div key={location.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={location.id}
                          checked={newPromotion.locationIds.includes(location.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewPromotion((prev) => ({
                                ...prev,
                                locationIds: [...prev.locationIds, location.id],
                              }))
                            } else {
                              setNewPromotion((prev) => ({
                                ...prev,
                                locationIds: prev.locationIds.filter((id) => id !== location.id),
                              }))
                            }
                          }}
                          disabled={newPromotion.locationIds.length === 0}
                        />
                        <label htmlFor={location.id} className="text-sm">
                          {location.name}
                          {location.is_primary && <Badge variant="outline" className="ml-2 text-xs">Principal</Badge>}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreatePromotion} disabled={!newPromotion.title || !newPromotion.description}>
                    Crear Promoción
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Plan Limits Progress */}
      {limits.maxActivePromotions !== null && limits.maxActivePromotions !== Infinity && (
        <PlanLimitProgress
          plan={plan}
          resourceType="promotions"
          currentCount={activeCount}
          extraPurchased={extraPromotionsPurchased}
        />
      )}

      {/* Extra Promotions Purchase CTA */}
      {!addPromotionCheck.canAdd && addPromotionCheck.requiresPayment && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">¿Necesitas más promociones?</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Has alcanzado el límite de tu plan. Compra promociones adicionales por solo ${EXTRA_PROMOTION_PRICE.toLocaleString()} COP cada una.
                </p>
                <div className="flex items-center gap-3">
                  <Button onClick={() => setIsPurchaseDialogOpen(true)}>
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Comprar Promociones
                  </Button>
                  <span className="text-sm text-muted-foreground">o</span>
                  <UpgradePlanButton
                    currentPlan={plan}
                    variant="outline"
                    size="default"
                  >
                    Mejorar Plan
                  </UpgradePlanButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Extra Promotions Dialog */}
      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comprar Promociones Adicionales</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Precio por promoción</span>
                <span className="font-semibold">${EXTRA_PROMOTION_PRICE.toLocaleString()} COP</span>
              </div>
              <p className="text-xs text-muted-foreground">Incluye IVA del 19%</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad de promociones</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={purchaseQuantity}
                onChange={(e) => setPurchaseQuantity(Number(e.target.value))}
              />
            </div>

            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total a pagar</span>
                <span className="text-2xl font-bold text-primary">
                  ${(purchaseQuantity * EXTRA_PROMOTION_PRICE).toLocaleString()} COP
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePurchaseExtraPromotions}>
              Continuar al Pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    {promo.is_featured && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                    <Badge variant="secondary" className="font-mono">
                      {promo.percentage}% OFF
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-2">{promo.description}</p>

                  {/* Location targeting info */}
                  <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{getLocationNames(promo.location_ids)}</span>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {promo.views_count || 0} vistas
                    </span>
                    <span>{promo.saves_count || 0} guardadas</span>
                    <span>{promo.redemptions_count || 0} redenciones</span>
                    <span>
                      Expira: {format(promo.expired_at, "dd/MM/yyyy")}
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

      {/* Empty State */}
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
              {!searchTerm && statusFilter === "all" && addPromotionCheck.canAdd && (
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
