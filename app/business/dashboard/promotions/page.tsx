"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Search, Filter, Eye, Edit, Star, ShoppingCart, AlertCircle, MapPin, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { showOnboardingStepToast } from "@/lib/onboarding-toast"
import { getPlanLimits, canAddPromotion, EXTRA_PROMOTION_PRICE } from "@/lib/plan-limits"
import { PlanLimitBadge, PlanLimitProgress } from "@/components/plan-limit-badge"
import { UpgradePlanButton } from "@/components/upgrade-plan-button"
import { PromotionService } from "@/lib/services/promotion-service"
import { LocationService } from "@/lib/services/location-service"
import { PROMOTION_STATUS_CONFIG } from "@/lib/constants/promotion-status"
import { PromotionFormDialog } from "@/components/promotions/promotion-form-dialog"
import { WarningsSection } from "@/components/dashboard/warning-card"
import { useBusinessWarningsContext } from "@/contexts/business-warnings-context"
import type { Promotion, PlanType, BusinessLocation } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { PermissionGuard } from "@/components/permission-guard"

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [locations, setLocations] = useState<BusinessLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false)
  const [purchaseQuantity, setPurchaseQuantity] = useState(1)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { user } = useAuth()
  const { getWarningsForPage, refresh, onboardingProgress } = useBusinessWarningsContext()
  const businessId = user?.businessId
  const plan: PlanType = (user as any)?.plan ?? "basico"
  const limits = getPlanLimits(plan)
  const promotionsWarnings = getWarningsForPage("promotions")

  // TODO: Fetch from business profile
  const extraPromotionsPurchased = 0

  // Early return if no businessId
  if (!businessId) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-destructive mr-3" />
        <span className="text-muted-foreground">
          Error: No se pudo identificar el negocio
        </span>
      </div>
    )
  }

  // Refresh promotions from Firebase
  const refreshPromotions = useCallback(async () => {
    try {
      const fetchedPromotions = await PromotionService.getPromotions({ businessId })
      setPromotions(fetchedPromotions)
    } catch (error) {
      console.error("Error refreshing promotions:", error)
      toast.error("No se pudieron actualizar las promociones")
    }
  }, [businessId])

  // Fetch promotions and locations from Firebase
  useEffect(() => {
    const fetchData = async () => {
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
        toast.error("No se pudieron cargar los datos")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [businessId])

  // Memoized filtered promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      const matchesSearch = promo.title.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || promo.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [promotions, searchTerm, statusFilter])

  // Count active promotions (per business, not per location - Schema V2)
  const activeCount = promotions.filter((p) => p.status === "active").length

  // Check if can add promotion
  const addPromotionCheck = canAddPromotion(plan, activeCount, extraPromotionsPurchased)

  // Memoized location lookup map for O(1) access
  const locationMap = useMemo(() => {
    return new Map(locations.map(loc => [loc.id, loc.name]))
  }, [locations])

  // Get status badge using shared config
  const getStatusBadge = useCallback((status: string) => {
    const config = PROMOTION_STATUS_CONFIG[status as keyof typeof PROMOTION_STATUS_CONFIG]
    if (!config) {
      return <Badge variant="outline">{status}</Badge>
    }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }, [])

  // Get location names efficiently
  const getLocationNames = useCallback((locationIds: string[]) => {
    if (locationIds.length === 0) return "Todas las ubicaciones"

    const names = locationIds
      .map((id) => locationMap.get(id))
      .filter(Boolean)

    return names.join(", ")
  }, [locationMap])

  // Open dialog for creating a new promotion
  const handleOpenCreateDialog = useCallback(() => {
    setEditingPromotion(null)
    setIsDialogOpen(true)
  }, [])

  // Open dialog for editing an existing promotion
  const handleOpenEditDialog = useCallback((promotion: Promotion) => {
    setEditingPromotion(promotion)
    setIsDialogOpen(true)
  }, [])

  const handlePurchaseExtraPromotions = () => {
    // TODO: Integrate with MercadoPago
    console.log(`Purchasing ${purchaseQuantity} extra promotions for ${purchaseQuantity * EXTRA_PROMOTION_PRICE} COP`)
    setIsPurchaseDialogOpen(false)
  }

  const handleFormSuccess = async () => {
    const hadNoPromotions = promotions.length === 0
    const isCreating = !editingPromotion

    await refreshPromotions()
    await refresh()

    // Show onboarding toast if this was the first promotion created
    if (hadNoPromotions && isCreating && onboardingProgress.isNewBusiness) {
      showOnboardingStepToast(
        "promotions",
        onboardingProgress.completedCount + 1,
        onboardingProgress.totalCount
      )
    }
  }

  const handleOpenDeleteDialog = (promotion: Promotion) => {
    setPromotionToDelete(promotion)
    setDeleteDialogOpen(true)
  }

  const handleDeletePromotion = async () => {
    if (!promotionToDelete || !businessId) return

    setIsDeleting(true)
    try {
      const success = await PromotionService.deletePromotion(promotionToDelete.id)

      if (success) {
        // Refresh promotions
        await refreshPromotions()
        await refresh()

        toast.success("Promoción eliminada exitosamente")
        setDeleteDialogOpen(false)
        setPromotionToDelete(null)
      } else {
        throw new Error("Failed to delete promotion")
      }
    } catch (error) {
      console.error("Error deleting promotion:", error)
      toast.error("No se pudo eliminar la promoción")
    } finally {
      setIsDeleting(false)
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Promociones</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gestiona tus ofertas y descuentos</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <PlanLimitBadge
            plan={plan}
            resourceType="promotions"
            currentCount={activeCount}
            extraPurchased={extraPromotionsPurchased}
            showIcon
          />
          <PermissionGuard
            permission="can_manage_promotions"
            fallback={
              <Button disabled title="No tienes permiso para crear promociones" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" />
                Nueva Promoción
              </Button>
            }
          >
            <Button
              onClick={handleOpenCreateDialog}
              disabled={!addPromotionCheck.canAdd && !addPromotionCheck.requiresPayment}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva Promoción
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Warnings Section */}
      <WarningsSection warnings={promotionsWarnings} title="Acciones Requeridas" />

      {/* Shared Form Dialog */}
      <PromotionFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        promotion={editingPromotion}
        businessId={businessId}
        plan={plan}
        onSuccess={handleFormSuccess}
        showPlanNotice={true}
        allowStatusChange={!!editingPromotion}
      />

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
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-5 w-5 text-primary flex-shrink-0" />
                  <h3 className="font-semibold">¿Necesitas más promociones?</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Has alcanzado el límite de tu plan. Compra promociones adicionales por solo ${EXTRA_PROMOTION_PRICE.toLocaleString()} COP cada una.
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <Button onClick={() => setIsPurchaseDialogOpen(true)} className="w-full sm:w-auto">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Comprar Promociones
                  </Button>
                  <span className="hidden sm:inline text-sm text-muted-foreground">o</span>
                  <UpgradePlanButton
                    currentPlan={plan}
                    variant="outline"
                    size="default"
                    className="w-full sm:w-auto"
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
              <label htmlFor="quantity" className="text-sm font-medium">Cantidad de promociones</label>
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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar promociones..."
            aria-label="Buscar promociones"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Filtrar promociones por estado">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="inactive">Inactivas</SelectItem>
            <SelectItem value="expired">Expiradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Promotions List */}
      <div className="space-y-4">
        {filteredPromotions.map((promo) => (
          <Card key={promo.id}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold truncate">{promo.title}</h3>
                    {getStatusBadge(promo.status)}
                    {promo.is_featured && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />}
                    <Badge variant="secondary" className="font-mono flex-shrink-0">
                      {promo.percentage}% OFF
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{promo.description}</p>

                  {/* Location targeting info */}
                  <div className="mb-3 flex items-start gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-1">{getLocationNames(promo.location_ids)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      {promo.views_count || 0} vistas
                    </span>
                    <span className="whitespace-nowrap">{promo.saves_count || 0} guardadas</span>
                    <span className="whitespace-nowrap">
                      Expira: {new Date((promo.expired_at as any).seconds * 1000).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center gap-2 self-start">
                  <PermissionGuard
                    permission="can_manage_promotions"
                    fallback={
                      <Button variant="ghost" size="icon" disabled title="No tienes permiso para editar">
                        <Edit className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditDialog(promo)}
                      title="Editar promoción"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>
                  <PermissionGuard
                    permission="can_manage_promotions"
                    fallback={
                      <Button variant="ghost" size="icon" disabled title="No tienes permiso para eliminar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDeleteDialog(promo)}
                      title="Eliminar promoción"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </PermissionGuard>
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
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Crear Primera Promoción
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar promoción?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              ¿Estás seguro de que deseas eliminar la promoción <strong>{promotionToDelete?.title}</strong>?
            </p>
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Esta acción no se puede deshacer</p>
                  <p className="text-destructive/90 mt-1">
                    Se eliminará permanentemente la promoción y su imagen asociada.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePromotion}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Promoción
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
