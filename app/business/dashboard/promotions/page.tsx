"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
import { ImageUpload } from "@/components/ui/image-upload"
import { Plus, Search, Filter, Eye, Edit, Copy, CalendarIcon, Star, MoreHorizontal, ShoppingCart, AlertCircle, MapPin, Loader2, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { getPlanLimits, canAddPromotion, EXTRA_PROMOTION_PRICE } from "@/lib/plan-limits"
import { PlanLimitBadge, PlanLimitProgress } from "@/components/plan-limit-badge"
import { UpgradePlanButton } from "@/components/upgrade-plan-button"
import { LockedFeature } from "@/components/locked-feature"
import { PromotionService } from "@/lib/services/promotion-service"
import { LocationService } from "@/lib/services/location-service"
import { uploadPromotionFeaturedImage, deletePromotionFeaturedImage, uploadWithRetry } from "@/lib/firebase-storage"
import { timestampToDate, getDefaultExpirationDate } from "@/lib/utils/date-helpers"
import { validatePromotionForm, clamp } from "@/lib/utils/validation"
import { PROMOTION_STATUS_CONFIG } from "@/lib/constants/promotion-status"
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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    percentage: 1,
    locationIds: [] as string[],
    expiredAt: getDefaultExpirationDate(),
    status: "active" as const,
    isFeatured: false,
  })

  const { user } = useAuth()
  const businessId = user?.businessId
  const plan: PlanType = (user as any)?.plan ?? "gratis"
  const limits = getPlanLimits(plan)

  // TODO: Fetch from business profile
  const extraPromotionsPurchased = 0
  const extraPromotionsActive = 0

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
    setSelectedImageFile(null)
    setFormData({
      title: "",
      description: "",
      instructions: "",
      percentage: 1,
      locationIds: [],
      expiredAt: getDefaultExpirationDate(),
      status: "active",
      isFeatured: false,
    })
    setIsDialogOpen(true)
  }, [])

  // Open dialog for editing an existing promotion
  const handleOpenEditDialog = useCallback((promotion: Promotion) => {
    setEditingPromotion(promotion)
    setSelectedImageFile(null)
    setFormData({
      title: promotion.title,
      description: promotion.description,
      instructions: promotion.instructions,
      percentage: promotion.percentage,
      locationIds: promotion.location_ids,
      expiredAt: timestampToDate(promotion.expired_at),
      status: promotion.status,
      isFeatured: promotion.is_featured,
    })
    setIsDialogOpen(true)
  }, [])

  const handlePurchaseExtraPromotions = () => {
    // TODO: Integrate with MercadoPago
    console.log(`Purchasing ${purchaseQuantity} extra promotions for ${purchaseQuantity * EXTRA_PROMOTION_PRICE} COP`)
    setIsPurchaseDialogOpen(false)
  }

  const handleSubmitPromotion = async () => {
    if (!businessId) return

    setIsSubmitting(true)
    let imageUploadFailed = false

    try {
      if (editingPromotion) {
        // EDIT MODE: Update promotion with optional new image
        let featuredImageUrl = editingPromotion.featured_image || ""

        // Handle image upload if a new file was selected
        if (selectedImageFile) {
          // Delete old image first
          if (editingPromotion.featured_image) {
            try {
              await deletePromotionFeaturedImage(editingPromotion.featured_image, editingPromotion.id)
            } catch (error) {
              console.error("Error deleting old image:", error)
              // Continue anyway - not critical
            }
          }

          // Upload new image with retry
          const uploadedUrl = await uploadWithRetry(
            () => uploadPromotionFeaturedImage(selectedImageFile, editingPromotion.id),
            2
          )

          if (uploadedUrl) {
            featuredImageUrl = uploadedUrl
          } else {
            imageUploadFailed = true
            console.error("Image upload failed after retries")
          }
        }

        const promotionData = {
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          percentage: formData.percentage,
          featured_image: featuredImageUrl,
          location_ids: formData.locationIds,
          expired_at: formData.expiredAt,
          status: formData.status,
          is_featured: formData.isFeatured,
        }

        const success = await PromotionService.updatePromotion(editingPromotion.id, promotionData)

        if (success) {
          // Refresh promotions
          const fetchedPromotions = await PromotionService.getPromotions({ businessId })
          setPromotions(fetchedPromotions)

          if (imageUploadFailed) {
            toast.success("Promoción actualizada exitosamente", {
              description: "Nota: La imagen no se pudo subir. Puedes intentar editarla nuevamente para agregar la imagen."
            })
          } else {
            toast.success("Promoción actualizada exitosamente")
          }

          setIsDialogOpen(false)
        } else {
          throw new Error("Failed to update promotion")
        }
      } else {
        // Step 1: Create promotion without image
        const initialPromotionData = {
          business_id: businessId,
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          percentage: formData.percentage,
          featured_image: "",
          location_ids: formData.locationIds,
          expired_at: formData.expiredAt,
          status: formData.status,
          is_featured: formData.isFeatured,
          views_count: 0,
          saves_count: 0,
          redemptions_count: 0,
        }

        const promotionId = await PromotionService.createPromotion(initialPromotionData)

        if (!promotionId) {
          throw new Error("Failed to create promotion")
        }

        // Step 2: Upload image if provided
        let featuredImageUrl = ""
        if (selectedImageFile) {
          const uploadedUrl = await uploadWithRetry(
            () => uploadPromotionFeaturedImage(selectedImageFile, promotionId),
            2
          )

          if (uploadedUrl) {
            featuredImageUrl = uploadedUrl
            // Step 3: Update promotion with image URL
            await PromotionService.updatePromotion(promotionId, {
              featured_image: uploadedUrl,
            })
          } else {
            imageUploadFailed = true
            console.error("Image upload failed after retries")
          }
        }

        // Refresh promotions
        const fetchedPromotions = await PromotionService.getPromotions({ businessId })
        setPromotions(fetchedPromotions)

        if (imageUploadFailed) {
          toast.success("Promoción creada exitosamente", {
            description: "Nota: La imagen no se pudo subir. Puedes editarla para agregar la imagen."
          })
        } else {
          toast.success("Promoción creada exitosamente")
        }

        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("Error saving promotion:", error)
      toast.error(`No se pudo ${editingPromotion ? "actualizar" : "crear"} la promoción`)
    } finally {
      setIsSubmitting(false)
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
        const fetchedPromotions = await PromotionService.getPromotions({ businessId })
        setPromotions(fetchedPromotions)

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
          <PermissionGuard
            permission="can_manage_promotions"
            fallback={
              <Button disabled title="No tienes permiso para crear promociones">
                <Plus className="h-4 w-4 mr-1" />
                Nueva Promoción
              </Button>
            }
          >
            <Button
              onClick={handleOpenCreateDialog}
              disabled={!addPromotionCheck.canAdd && !addPromotionCheck.requiresPayment}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nueva Promoción
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Create/Edit Promotion Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPromotion ? "Editar Promoción" : "Crear Nueva Promoción"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Plan Gratis - Pay per promotion notice (only for create) */}
            {plan === "gratis" && !editingPromotion && (
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
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Textarea
                id="description"
                placeholder="Describe los términos y condiciones de la promoción..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instrucciones de redención *</Label>
              <Textarea
                id="instructions"
                placeholder="Ej: Presenta tu identificación militar al momento de ordenar"
                value={formData.instructions}
                onChange={(e) => setFormData((prev) => ({ ...prev, instructions: e.target.value }))}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="percentage">Porcentaje de descuento *</Label>
              <Input
                id="percentage"
                type="number"
                min="1"
                max="100"
                step="1"
                placeholder="20"
                value={formData.percentage}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10)
                  if (!isNaN(value)) {
                    setFormData((prev) => ({ ...prev, percentage: clamp(value, 1, 100) }))
                  }
                }}
                onBlur={(e) => {
                  if (!e.target.value || parseInt(e.target.value) < 1) {
                    setFormData((prev) => ({ ...prev, percentage: 1 }))
                  }
                }}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Valor entre 1 y 100</p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Imagen destacada</Label>
              <ImageUpload
                value={editingPromotion?.featured_image}
                onChange={setSelectedImageFile}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de expiración *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left bg-transparent" disabled={isSubmitting}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(formData.expiredAt, "PPP", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expiredAt}
                    onSelect={(date) => date && setFormData((prev) => ({ ...prev, expiredAt: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Selection (only for edit mode) */}
            {editingPromotion && (
              <div className="space-y-2">
                <Label htmlFor="status">Estado de la promoción</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activa</SelectItem>
                    <SelectItem value="inactive">Inactiva</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Featured Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="featured" className="text-base">Promoción destacada</Label>
                <p className="text-sm text-muted-foreground">
                  Las promociones destacadas aparecen primero en la app
                </p>
              </div>
              <Switch
                id="featured"
                checked={formData.isFeatured}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFeatured: checked }))}
                disabled={isSubmitting}
              />
            </div>

            {/* Location Targeting */}
            <div className="space-y-3">
              <Label>Ubicaciones donde aplica</Label>
              <p className="text-xs text-muted-foreground">
                Selecciona "Todas las ubicaciones" o marca ubicaciones específicas
              </p>
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all-locations"
                    checked={formData.locationIds.length === 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData((prev) => ({ ...prev, locationIds: [] }))
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor="all-locations"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Todas las ubicaciones
                  </label>
                </div>
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={location.id}
                      checked={formData.locationIds.includes(location.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData((prev) => ({
                            ...prev,
                            locationIds: [...prev.locationIds, location.id],
                          }))
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            locationIds: prev.locationIds.filter((id) => id !== location.id),
                          }))
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor={location.id}
                      className={`text-sm cursor-pointer ${isSubmitting ? 'opacity-50' : ''}`}
                    >
                      {location.name}
                      {location.is_primary && <Badge variant="outline" className="ml-2 text-xs">Principal</Badge>}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmitPromotion}
                disabled={!formData.title || !formData.description || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  editingPromotion ? "Actualizar Promoción" : "Crear Promoción"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            aria-label="Buscar promociones"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" aria-label="Filtrar promociones por estado">
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
                    <span>
                      Expira: {new Date((promo.expired_at as any).seconds * 1000).toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
