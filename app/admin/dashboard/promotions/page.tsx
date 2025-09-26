"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Tag,
  Building2,
  Calendar,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Star,
  MapPin,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react"

// Mock data for promotion moderation
const mockPromotions = [
  {
    id: "1",
    title: "20% de descuento en almuerzo ejecutivo",
    description: "Disfruta de nuestro delicioso almuerzo ejecutivo con 20% de descuento válido para militares activos y pensionados.",
    businessName: "Restaurante El Dorado",
    businessId: "bus1",
    type: "percentage",
    value: 20,
    originalPrice: 35000,
    discountedPrice: 28000,
    status: "pending",
    startDate: new Date("2024-01-25"),
    endDate: new Date("2024-02-25"),
    maxRedemptions: 100,
    currentRedemptions: 0,
    digitalCardEligible: true,
    isFeatured: false,
    category: "Restaurante",
    submittedAt: new Date("2024-01-22"),
    flags: [],
    moderationNotes: "",
    businessPlan: "Pro",
    locations: ["Bogotá Centro", "Bogotá Norte"],
  },
  {
    id: "2",
    title: "Envío gratis en compras superiores a $100.000",
    description: "Aprovecha el envío gratuito en todas tus compras online superiores a $100.000. Válido en toda Colombia.",
    businessName: "Tienda Fashion Plus",
    businessId: "bus2",
    type: "free_shipping",
    value: 0,
    originalPrice: 15000,
    discountedPrice: 0,
    status: "flagged",
    startDate: new Date("2024-01-20"),
    endDate: new Date("2024-03-20"),
    maxRedemptions: 500,
    currentRedemptions: 12,
    digitalCardEligible: true,
    isFeatured: false,
    category: "Retail",
    submittedAt: new Date("2024-01-18"),
    flags: ["unclear_terms", "excessive_duration"],
    moderationNotes: "La duración de 2 meses excede el límite estándar",
    businessPlan: "Básico",
    locations: ["Medellín", "Bogotá"],
  },
  {
    id: "3",
    title: "2x1 en café de la casa + postre",
    description: "Disfruta de nuestro café especial de la casa con un postre gratis. Promoción válida de lunes a viernes.",
    businessName: "Café Central",
    businessId: "bus3",
    type: "bogo",
    value: 50,
    originalPrice: 18000,
    discountedPrice: 18000,
    status: "approved",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-02-15"),
    maxRedemptions: 200,
    currentRedemptions: 45,
    digitalCardEligible: true,
    isFeatured: true,
    category: "Restaurante",
    submittedAt: new Date("2024-01-12"),
    flags: [],
    moderationNotes: "Aprobada - promoción estándar sin problemas",
    businessPlan: "Enterprise",
    locations: ["Cali Centro"],
  },
  {
    id: "4",
    title: "$50.000 de descuento en servicio premium",
    description: "Obtén $50.000 de descuento en nuestro servicio premium de asesoría financiera personalizada.",
    businessName: "Asesoría Financiera Pro",
    businessId: "bus4",
    type: "fixed",
    value: 50000,
    originalPrice: 350000,
    discountedPrice: 300000,
    status: "pending",
    startDate: new Date("2024-01-30"),
    endDate: new Date("2024-02-29"),
    maxRedemptions: 20,
    currentRedemptions: 0,
    digitalCardEligible: false,
    isFeatured: false,
    category: "Servicios",
    submittedAt: new Date("2024-01-23"),
    flags: ["high_value"],
    moderationNotes: "Requiere verificación adicional por alto valor",
    businessPlan: "Pro",
    locations: ["Bogotá", "Medellín", "Cali"],
  },
]

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState(mockPromotions)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null)
  const [moderationNotes, setModerationNotes] = useState("")

  const filteredPromotions = promotions.filter((promotion) => {
    const matchesSearch =
      promotion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promotion.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || promotion.status === statusFilter
    const matchesCategory = categoryFilter === "all" || promotion.category.toLowerCase() === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "default",
      pending: "secondary",
      flagged: "destructive",
      rejected: "destructive",
      expired: "outline",
    } as const

    const labels = {
      approved: "Aprobada",
      pending: "Pendiente",
      flagged: "Marcada",
      rejected: "Rechazada",
      expired: "Expirada",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const labels = {
      percentage: "% Descuento",
      fixed: "$ Descuento",
      bogo: "2x1",
      free_shipping: "Envío gratis",
      flash_deal: "Oferta flash",
    }
    return <Badge variant="outline">{labels[type as keyof typeof labels] || type}</Badge>
  }

  const getPlanBadge = (plan: string) => {
    const isPremium = plan === "Pro" || plan === "Enterprise"
    return (
      <Badge variant={isPremium ? "default" : "secondary"} className="flex items-center gap-1">
        {isPremium && <Star className="h-3 w-3" />}
        {plan}
      </Badge>
    )
  }

  const handleApprove = (promotionId: string) => {
    setPromotions((prev) => prev.map((p) =>
      p.id === promotionId
        ? { ...p, status: "approved", moderationNotes: moderationNotes || "Aprobada sin observaciones" }
        : p
    ))
    setModerationNotes("")
  }

  const handleReject = (promotionId: string) => {
    if (!moderationNotes.trim()) {
      alert("Por favor ingresa las razones del rechazo")
      return
    }
    setPromotions((prev) => prev.map((p) =>
      p.id === promotionId
        ? { ...p, status: "rejected", moderationNotes }
        : p
    ))
    setModerationNotes("")
  }

  const handleFlag = (promotionId: string) => {
    if (!moderationNotes.trim()) {
      alert("Por favor ingresa las razones para marcar la promoción")
      return
    }
    setPromotions((prev) => prev.map((p) =>
      p.id === promotionId
        ? { ...p, status: "flagged", moderationNotes, flags: [...p.flags, "manual_review"] }
        : p
    ))
    setModerationNotes("")
  }

  const exportPromotions = () => {
    const csvContent = [
      "Título,Empresa,Tipo,Valor,Estado,Fecha Inicio,Fecha Fin,Redenciones,Plan",
      ...filteredPromotions.map(promo =>
        `"${promo.title}","${promo.businessName}","${promo.type}",${promo.value},"${promo.status}","${promo.startDate.toLocaleDateString()}","${promo.endDate.toLocaleDateString()}",${promo.currentRedemptions},"${promo.businessPlan}"`
      )
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
          <h1 className="text-2xl font-bold text-foreground">Moderación de Promociones</h1>
          <p className="text-muted-foreground">Revisa y aprueba promociones enviadas por empresas</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{promotions.filter((p) => p.status === "pending").length} pendientes</Badge>
          <Badge variant="destructive">{promotions.filter((p) => p.status === "flagged").length} marcadas</Badge>
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
              <SelectItem value="approved">Aprobadas</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="flagged">Marcadas</SelectItem>
              <SelectItem value="rejected">Rechazadas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="restaurante">Restaurante</SelectItem>
              <SelectItem value="retail">Retail</SelectItem>
              <SelectItem value="servicios">Servicios</SelectItem>
              <SelectItem value="salud">Salud</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Promotions List */}
      <div className="space-y-4">
        {filteredPromotions.map((promotion) => (
          <Card key={promotion.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{promotion.title}</h3>
                    {getStatusBadge(promotion.status)}
                    {getTypeBadge(promotion.type)}
                    {getPlanBadge(promotion.businessPlan)}
                    {promotion.isFeatured && <Badge className="bg-yellow-100 text-yellow-800">Destacada</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{promotion.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {promotion.businessName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        {promotion.category}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {promotion.locations.join(", ")}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {promotion.type === "percentage"
                          ? `${promotion.value}% de descuento`
                          : promotion.type === "fixed"
                          ? `$${promotion.value.toLocaleString()} de descuento`
                          : promotion.type === "bogo"
                          ? "2x1"
                          : "Envío gratis"
                        }
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {promotion.startDate.toLocaleDateString()} - {promotion.endDate.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {promotion.currentRedemptions}/{promotion.maxRedemptions} redenciones
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Enviada: {promotion.submittedAt.toLocaleDateString()}
                    </span>
                    {promotion.digitalCardEligible && (
                      <Badge variant="outline" className="text-xs">Tarjeta digital</Badge>
                    )}
                  </div>
                  {promotion.flags.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-600">
                        Marcadores: {promotion.flags.join(", ")}
                      </span>
                    </div>
                  )}
                  {promotion.moderationNotes && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <strong>Notas de moderación:</strong> {promotion.moderationNotes}
                    </div>
                  )}
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
                                      <span className="font-medium">Tipo:</span> {selectedPromotion.type}
                                    </div>
                                    <div>
                                      <span className="font-medium">Valor:</span> {selectedPromotion.value}
                                      {selectedPromotion.type === "percentage" ? "%" : selectedPromotion.type === "fixed" ? " COP" : ""}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium mb-2">Configuración</h4>
                                  <div className="space-y-2 text-sm">
                                    <div>
                                      <span className="font-medium">Fecha inicio:</span> {selectedPromotion.startDate.toLocaleString()}
                                    </div>
                                    <div>
                                      <span className="font-medium">Fecha fin:</span> {selectedPromotion.endDate.toLocaleString()}
                                    </div>
                                    <div>
                                      <span className="font-medium">Redenciones máx:</span> {selectedPromotion.maxRedemptions}
                                    </div>
                                    <div>
                                      <span className="font-medium">Tarjeta digital:</span> {selectedPromotion.digitalCardEligible ? "Sí" : "No"}
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
                                    <span className="font-medium">Nombre:</span> {selectedPromotion.businessName}
                                  </div>
                                  <div>
                                    <span className="font-medium">Plan:</span> {selectedPromotion.businessPlan}
                                  </div>
                                  <div>
                                    <span className="font-medium">Categoría:</span> {selectedPromotion.category}
                                  </div>
                                  <div>
                                    <span className="font-medium">Ubicaciones:</span> {selectedPromotion.locations.join(", ")}
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
                                    <div>Actual: {selectedPromotion.currentRedemptions}</div>
                                    <div>Máximo: {selectedPromotion.maxRedemptions}</div>
                                    <div>Tasa: {((selectedPromotion.currentRedemptions / selectedPromotion.maxRedemptions) * 100).toFixed(1)}%</div>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <TrendingUp className="h-4 w-4" />
                                      <span className="font-medium">Estado</span>
                                    </div>
                                    <div>Estado: {selectedPromotion.status}</div>
                                    <div>Destacada: {selectedPromotion.isFeatured ? "Sí" : "No"}</div>
                                  </div>
                                </div>
                              </div>
                            </TabsContent>
                          </Tabs>

                          {/* Moderation Section */}
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Moderación</h4>
                            <Textarea
                              placeholder="Ingresa notas de moderación..."
                              value={moderationNotes}
                              onChange={(e) => setModerationNotes(e.target.value)}
                              className="mb-4"
                            />
                            <div className="flex gap-2">
                              {selectedPromotion.status === "pending" && (
                                <>
                                  <Button onClick={() => handleApprove(selectedPromotion.id)}>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Aprobar
                                  </Button>
                                  <Button variant="destructive" onClick={() => handleReject(selectedPromotion.id)}>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Rechazar
                                  </Button>
                                  <Button variant="outline" onClick={() => handleFlag(selectedPromotion.id)}>
                                    <AlertTriangle className="h-4 w-4 mr-1" />
                                    Marcar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {promotion.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(promotion.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleReject(promotion.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </>
                  )}

                  {promotion.status === "approved" && (
                    <Button variant="outline" size="sm" onClick={() => handleFlag(promotion.id)}>
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Marcar
                    </Button>
                  )}

                  {promotion.status === "flagged" && (
                    <Button size="sm" onClick={() => handleApprove(promotion.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Restaurar
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