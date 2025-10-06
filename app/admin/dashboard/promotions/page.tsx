"use client"

import { useState } from "react"
import { useCategories } from "@/hooks/use-categories"
import { usePromotions } from "@/hooks/use-promotions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Tag,
  Building2,
  Calendar,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Download,
  Clock,
  Users,
  ImageIcon,
} from "lucide-react"


export default function AdminPromotionsPage() {
  const { categories } = useCategories()
  const { promotions, isLoading, refreshPromotions, updatePromotionStatus } = usePromotions()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null)

  const filteredPromotions = promotions.filter((promotion) => {
    const matchesSearch =
      promotion.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.instructions?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || promotion.status === statusFilter
    // For now, we'll skip category filtering since advertisements don't have categories directly
    // This could be enhanced by looking up the business and checking its categories
    const matchesCategory = categoryFilter === "all" // || promotion.category === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      inactive: "secondary",
    } as const

    const labels = {
      active: "Activa",
      inactive: "Inactiva",
    }

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{labels[status as keyof typeof labels] || status}</Badge>
  }

  const handleActivate = async (promotionId: string) => {
    const success = await updatePromotionStatus(promotionId, "active")
    if (success) {
      await refreshPromotions()
    }
  }

  const handleDeactivate = async (promotionId: string) => {
    const success = await updatePromotionStatus(promotionId, "inactive")
    if (success) {
      await refreshPromotions()
    }
  }



  const exportPromotions = () => {
    const csvContent = [
      "Título,ID Empresa,Porcentaje,Estado,Fecha Creación,Fecha Expiración",
      ...filteredPromotions.map(promo => {
        const createdDate = promo.createdAt
          ? (promo.createdAt as any).seconds
            ? new Date((promo.createdAt as any).seconds * 1000).toLocaleDateString()
            : new Date(promo.createdAt as Date).toLocaleDateString()
          : "N/A"
        const expiredDate = promo.expired_at
          ? (promo.expired_at as any).seconds
            ? new Date((promo.expired_at as any).seconds * 1000).toLocaleDateString()
            : new Date(promo.expired_at as Date).toLocaleDateString()
          : "N/A"
        return `"${promo.title}","${promo.business_id}",${promo.percentage},"${promo.status}","${createdDate}","${expiredDate}"`
      })
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "promociones_heroes_colombia.csv"
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
          <Badge variant="default">{promotions.filter((p) => p.status === "active").length} activas</Badge>
          <Badge variant="secondary">{promotions.filter((p) => p.status === "inactive").length} inactivas</Badge>
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
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.category_id} value={category.category_id}>
                  {category.name}
                </SelectItem>
              ))}
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
        ) : filteredPromotions.map((promotion) => (
          <Card key={promotion.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{promotion.title}</h3>
                    {getStatusBadge(promotion.status)}
                    <Badge variant="outline">{promotion.percentage}% Descuento</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{promotion.description}</p>
                  {promotion.instructions && (
                    <p className="text-xs text-blue-600 mb-3">
                      <strong>Instrucciones:</strong> {promotion.instructions}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        ID Empresa: {promotion.business_id}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {promotion.percentage}% de descuento
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Expira: {promotion.expired_at ? ((promotion.expired_at as any).seconds ? new Date((promotion.expired_at as any).seconds * 1000).toLocaleDateString() : new Date(promotion.expired_at as Date).toLocaleDateString()) : "N/A"}
                      </div>
                      {promotion.featured_image && (
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Imagen destacada disponible
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Creada: {promotion.createdAt ? ((promotion.createdAt as any).seconds ? new Date((promotion.createdAt as any).seconds * 1000).toLocaleDateString() : new Date(promotion.createdAt as Date).toLocaleDateString()) : "N/A"}
                    </span>
                    <Badge variant="outline" className="text-xs">ID: {promotion.id}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedPromotion(promotion)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Revisar Promoción</DialogTitle>
                      </DialogHeader>
                      {selectedPromotion && (
                        <div className="space-y-6">
                          <Tabs defaultValue="details" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger value="details">Detalles</TabsTrigger>
                              <TabsTrigger value="business">Empresa</TabsTrigger>
                              <TabsTrigger value="performance">Rendimiento</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium mb-2">Información de la Promoción</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="font-medium">Título:</span> {selectedPromotion.title}
                                    </div>
                                    <div>
                                      <span className="font-medium">Descripción:</span> {selectedPromotion.description}
                                    </div>
                                    <div>
                                      <span className="font-medium">Porcentaje:</span> {selectedPromotion.percentage}%
                                    </div>
                                    <div>
                                      <span className="font-medium">Instrucciones:</span> {selectedPromotion.instructions || "N/A"}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Configuración</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="font-medium">Creado:</span> {selectedPromotion.createdAt ? ((selectedPromotion.createdAt as any).seconds ? new Date((selectedPromotion.createdAt as any).seconds * 1000).toLocaleString() : new Date(selectedPromotion.createdAt as Date).toLocaleString()) : "N/A"}
                                    </div>
                                    <div>
                                      <span className="font-medium">Expira:</span> {selectedPromotion.expired_at ? ((selectedPromotion.expired_at as any).seconds ? new Date((selectedPromotion.expired_at as any).seconds * 1000).toLocaleString() : new Date(selectedPromotion.expired_at as Date).toLocaleString()) : "N/A"}
                                    </div>
                                    <div>
                                      <span className="font-medium">Estado:</span> {selectedPromotion.status}
                                    </div>
                                    <div>
                                      <span className="font-medium">Imagen destacada:</span> {selectedPromotion.featured_image ? "Sí" : "No"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                            <TabsContent value="business" className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Información de la Empresa</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">ID Empresa:</span> {selectedPromotion.business_id}
                                  </div>
                                  <div>
                                    <span className="font-medium">Estado:</span> {selectedPromotion.status}
                                  </div>
                                  <div>
                                    <span className="font-medium">Porcentaje:</span> {selectedPromotion.percentage}%
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                            <TabsContent value="performance" className="space-y-4">
                              <div>
                                <h4 className="font-medium mb-2">Métricas de Rendimiento</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Users className="h-4 w-4" />
                                      <span className="font-medium">Redenciones</span>
                                    </div>
                                    <div>Estado: {selectedPromotion.status}</div>
                                    <div>Porcentaje: {selectedPromotion.percentage}%</div>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <DollarSign className="h-4 w-4" />
                                      <span className="font-medium">Estado</span>
                                    </div>
                                    <div>Imagen: {selectedPromotion.featured_image ? "Sí" : "No"}</div>
                                    <div>ID: {selectedPromotion.id}</div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>

                          {/* Status Management Section */}
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Gestión de Estado</h4>
                            <div className="flex gap-2">
                              {selectedPromotion.status === "active" ? (
                                <Button variant="outline" onClick={() => handleDeactivate(selectedPromotion.id)}>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Desactivar
                                </Button>
                              ) : (
                                <Button onClick={() => handleActivate(selectedPromotion.id)}>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Activar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {promotion.status === "active" ? (
                    <Button variant="outline" size="sm" onClick={() => handleDeactivate(promotion.id)}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Desactivar
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleActivate(promotion.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Activar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPromotions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron promociones</h3>
            <p className="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}