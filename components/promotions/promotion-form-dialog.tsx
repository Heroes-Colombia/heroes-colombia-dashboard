"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ImageUploadWithCrop } from "@/components/ui/image-upload-with-crop"
import { CalendarIcon, Loader2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"
import { PromotionService } from "@/lib/services/promotion-service"
import { LocationService } from "@/lib/services/location-service"
import { uploadPromotionFeaturedImage, deletePromotionFeaturedImage, uploadWithRetry } from "@/lib/firebase-storage"
import { timestampToDate, getDefaultExpirationDate } from "@/lib/utils/date-helpers"
import { clamp } from "@/lib/utils/validation"
import { EXTRA_PROMOTION_PRICE } from "@/lib/plan-limits"
import type { Promotion, BusinessLocation, PromotionStatus, PlanType } from "@/lib/types"

interface PromotionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  promotion?: Promotion | null // If provided, edit mode; otherwise create mode
  businessId: string
  plan?: PlanType
  onSuccess?: () => void
  showPlanNotice?: boolean // Show plan gratis notice for create mode
  allowStatusChange?: boolean // Allow changing status (for admin)
}

export function PromotionFormDialog({
  open,
  onOpenChange,
  promotion,
  businessId,
  plan = "enterprise",
  onSuccess,
  showPlanNotice = false,
  allowStatusChange = false,
}: PromotionFormDialogProps) {
  const [locations, setLocations] = useState<BusinessLocation[]>([])
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    percentage: 1,
    locationIds: [] as string[],
    expiredAt: getDefaultExpirationDate(),
    status: "active" as PromotionStatus,
    isFeatured: false,
  })

  // Fetch locations when dialog opens
  useEffect(() => {
    if (open && businessId) {
      LocationService.getBusinessLocations(businessId).then(setLocations)
    }
  }, [open, businessId])

  // Initialize form data when promotion changes
  useEffect(() => {
    if (promotion) {
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
      setSelectedImageFile(null)
    } else {
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
      setSelectedImageFile(null)
    }
  }, [promotion])

  const handleImageChange = (file: File | null) => {
    setSelectedImageFile(file)
  }

  const handleSubmit = async () => {
    if (!businessId) return

    setIsSubmitting(true)
    let imageUploadFailed = false

    try {
      if (promotion) {
        // EDIT MODE
        let featuredImageUrl = promotion.featured_image || ""

        // Handle image upload if a new file was selected
        if (selectedImageFile) {
          // Delete old image first
          if (promotion.featured_image) {
            try {
              await deletePromotionFeaturedImage(promotion.featured_image, promotion.id)
            } catch (error) {
              console.error("Error deleting old image:", error)
            }
          }

          // Upload new image with retry
          const uploadedUrl = await uploadWithRetry(
            () => uploadPromotionFeaturedImage(selectedImageFile, promotion.id),
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

        const success = await PromotionService.updatePromotion(promotion.id, promotionData)

        if (success) {
          if (imageUploadFailed) {
            toast.success("Promoción actualizada exitosamente", {
              description: "Nota: La imagen no se pudo subir. Puedes intentar editarla nuevamente para agregar la imagen."
            })
          } else {
            toast.success("Promoción actualizada exitosamente")
          }
          onSuccess?.()
          onOpenChange(false)
        } else {
          throw new Error("Failed to update promotion")
        }
      } else {
        // CREATE MODE
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

        // Upload image if provided
        if (selectedImageFile) {
          const uploadedUrl = await uploadWithRetry(
            () => uploadPromotionFeaturedImage(selectedImageFile, promotionId),
            2
          )

          if (uploadedUrl) {
            await PromotionService.updatePromotion(promotionId, {
              featured_image: uploadedUrl,
            })
          } else {
            imageUploadFailed = true
            console.error("Image upload failed after retries")
          }
        }

        if (imageUploadFailed) {
          toast.success("Promoción creada exitosamente", {
            description: "Nota: La imagen no se pudo subir. Puedes editarla para agregar la imagen."
          })
        } else {
          toast.success("Promoción creada exitosamente")
        }

        onSuccess?.()
        onOpenChange(false)
      }
    } catch (error) {
      console.error("Error saving promotion:", error)
      toast.error(`No se pudo ${promotion ? "actualizar" : "crear"} la promoción`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>{promotion ? "Editar Promoción" : "Crear Nueva Promoción"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Plan Gratis Notice */}
          {showPlanNotice && plan === "gratis" && !promotion && (
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

          {/* Title */}
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

          {/* Description */}
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

          {/* Instructions */}
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

          {/* Percentage */}
          <div className="space-y-2">
            <Label htmlFor="percentage">Porcentaje de descuento *</Label>
            <Input
              id="percentage"
              type="number"
              min="0"
              max="100"
              placeholder="20"
              value={formData.percentage}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, percentage: clamp(parseInt(e.target.value, 10), 0, 100) }))
              }}
              onBlur={(e) => {
                if (!e.target.value || parseInt(e.target.value) < 1) {
                  setFormData((prev) => ({ ...prev, percentage: 0 }))
                }
              }}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">Valor entre 0 y 100</p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Imagen destacada</Label>
            <ImageUploadWithCrop
              value={promotion?.featured_image}
              onChange={handleImageChange}
              disabled={isSubmitting}
              recommendedDimensions="1600x800px (2:1)"
              maxSizeMB={5}
              aspectRatio={2 / 1}
              minCroppedWidth={800}
              minCroppedHeight={400}
            />
            <p className="text-xs text-muted-foreground">
              La imagen se visualizará en el carrusel de la app móvil. Podrás ajustarla y posicionarla antes de subirla.
            </p>
          </div>

          {/* Expiration Date */}
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

          {/* Status Selection (for edit mode or admin) */}
          {(promotion || allowStatusChange) && (
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title || !formData.description || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                promotion ? "Actualizar Promoción" : "Crear Promoción"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
