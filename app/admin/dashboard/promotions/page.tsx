"use client"

import { useState } from "react"
import { useCategories } from "@/hooks/use-categories"
import { usePromotions } from "@/hooks/use-promotions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PromotionFormDialog } from "@/components/promotions/promotion-form-dialog"
import {
  Search,
  Tag,
  Calendar,
  Eye,
  Download,
  Clock,
  ImageIcon,
  Star,
} from "lucide-react"
import type { Promotion } from "@/lib/types"


export default function AdminPromotionsPage() {
  const { promotions, isLoading, refresh: refreshPromotions } = usePromotions()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [promotionToEdit, setPromotionToEdit] = useState<Promotion | null>(null)

  const filteredPromotions = promotions?.filter((promotion) => {
    const matchesSearch =
      promotion.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.instructions?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || promotion.status === statusFilter
    return matchesSearch && matchesStatus
  }) || []

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
      expired: "outline",
    } as const

    const labels = {
      active: "Activa",
      inactive: "Inactiva",
      expired: "Expirada",
    }

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{labels[status as keyof typeof labels] || status}</Badge>
  }

  const handleViewDetails = (promotion: Promotion) => {
    setIsEditDialogOpen(true)
    setPromotionToEdit(promotion)
  }

  const handleEditSuccess = async () => {
    await refreshPromotions()
    setIsEditDialogOpen(false)
    setPromotionToEdit(null)
  }

  const exportPromotions = () => {
    const csvContent = [
      "Título,ID Empresa,Porcentaje,Estado,Fecha Creación,Fecha Expiración,Vistas,Guardadas,Redenciones",
      ...filteredPromotions.map(promo => {
        const createdDate = promo.created_at
          ? (promo.created_at as any).seconds
            ? new Date((promo.created_at as any).seconds * 1000).toLocaleDateString()
            : new Date(promo.created_at as Date).toLocaleDateString()
          : "N/A"
        const expiredDate = promo.expired_at
          ? (promo.expired_at as any).seconds
            ? new Date((promo.expired_at as any).seconds * 1000).toLocaleDateString()
            : new Date(promo.expired_at as Date).toLocaleDateString()
          : "N/A"
        return `"${promo.title}","${promo.business_id}",${promo.percentage},"${promo.status}","${createdDate}","${expiredDate}",${promo.views_count || 0},${promo.saves_count || 0},${promo.redemptions_count || 0}`
      })
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `promociones_heroes_colombia_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Promociones</h1>
          <p className="text-muted-foreground">Administra promociones activas e inactivas de las empresas</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">{promotions?.filter((p) => p.status === "active").length} activas</Badge>
          <Badge variant="secondary">{promotions?.filter((p) => p.status === "inactive").length} inactivas</Badge>
          <Badge variant="outline">{promotions?.filter((p) => p.status === "expired").length} expiradas</Badge>
          <Button onClick={exportPromotions} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar promociones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="inactive">Inactivas</SelectItem>
              <SelectItem value="expired">Expiradas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Promotions List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Cargando promociones...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredPromotions?.map((promotion) => (
              <Card
                key={promotion.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewDetails(promotion)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left side - Image thumbnail (if exists) */}
                    {promotion.featured_image && (
                      <div className="hidden sm:block relative h-20 w-32 rounded-lg overflow-hidden flex-shrink-0 border">
                        <img
                          src={promotion.featured_image}
                          alt={promotion.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}

                    {/* Middle - Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold truncate">{promotion.title}</h3>
                        {getStatusBadge(promotion.status)}
                        {promotion.is_featured && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                        <Badge variant="outline">{promotion.percentage}% Descuento</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{promotion.description}</p>
                      {promotion.instructions && (
                        <p className="text-xs text-blue-600 mb-3 line-clamp-1">
                          <strong>Instrucciones:</strong> {promotion.instructions}
                        </p>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Expira: {promotion.expired_at ? ((promotion.expired_at as any).seconds ? new Date((promotion.expired_at as any).seconds * 1000).toLocaleDateString("es-CO", { month: "short", day: "numeric" }) : new Date(promotion.expired_at as Date).toLocaleDateString("es-CO", { month: "short", day: "numeric" })) : "N/A"}
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          {promotion.views_count || 0} vistas
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {promotion.redemptions_count || 0} redenciones
                        </div>
                      </div>
                      {!promotion.featured_image && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                          <ImageIcon className="h-3 w-3" />
                          Sin imagen destacada
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredPromotions?.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron promociones</h3>
            <p className="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
          </CardContent>
        </Card>
      )}

      {/* Full Edit Form Dialog */}
      <PromotionFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        promotion={promotionToEdit}
        businessId={promotionToEdit?.business_id || ""}
        plan="enterprise"
        onSuccess={handleEditSuccess}
        showPlanNotice={false}
        allowStatusChange={true}
      />
    </div>
  )
}
