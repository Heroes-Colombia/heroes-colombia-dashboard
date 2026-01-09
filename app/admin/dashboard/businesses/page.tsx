"use client"

import { useState, useEffect } from "react"
import { useCategories } from "@/hooks/use-categories"
import { useBusinesses } from "@/hooks/use-businesses"
import { usePromotions } from "@/hooks/use-promotions"
import { LocationService } from "@/lib/services/location-service"
import { AnalyticsEventService } from "@/lib/services/analytics-service"
import { getPlanLimits } from "@/lib/plan-limits"
import { formatBusinessHours, formatDate, formatDateTime } from "@/lib/helpers/business-helpers"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Building2,
  MapPin,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Crown,
  Download,
  Store,
  ShoppingBag,
  Globe,
  Tag,
} from "lucide-react"
import { PromotionService } from "@/lib/services/promotion-service"


export default function AdminBusinessesPage() {
  const { getCategoryName } = useCategories()
  const { businesses, isLoading, refreshBusinesses, updateBusinessStatus } = useBusinesses()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null)

  // Resource counts per business (cached)
  const [businessCounts, setBusinessCounts] = useState<Record<string, { locations: number; promotions: number }>>({})

  // Modal data
  const [modalLocations, setModalLocations] = useState<any[]>([])
  const [modalAnalytics, setModalAnalytics] = useState<any>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Hooks for selected business
  const { promotions } = usePromotions({ businessId: selectedBusiness?.id })

  const handleApprove = async (businessId: string) => {
    const success = await updateBusinessStatus(businessId, "approved", "Empresa aprobada por el administrador")
    if (success) {
      await refreshBusinesses()
    }
  }

  const handleReject = async (businessId: string) => {
    const success = await updateBusinessStatus(businessId, "rejected", "Empresa rechazada por el administrador")
    if (success) {
      await refreshBusinesses()
    }
  }

  const handleFlag = async (businessId: string) => {
    const success = await updateBusinessStatus(businessId, "suspended", "Empresa marcada para revisión")
    if (success) {
      await refreshBusinesses()
    }
  }

  const exportBusinesses = () => {
    const csvContent = [
      "Nombre,NIT,Email,Teléfono,Propietario,Estado,Plan,Tipo,Categorías,Dirección",
      ...filteredBusinesses.map((business) => {
        const regDate = business.created_at
          ? business.created_at instanceof Date
            ? business.created_at.toLocaleDateString()
            : (business.created_at as any).seconds
              ? new Date((business.created_at as any).seconds * 1000).toLocaleDateString()
              : "N/A"
          : "N/A"
        const categories = business.categories?.map((c) => getCategoryName(c)).join("; ") || ""
        const businessType = business.type || "N/A"
        return `"${business.name}","${business.identification}","${business.email}","${business.phone_number || "N/A"}","${business.owner_name}","${business.status}","${business.plan || "Básico"}","${businessType}","${categories}","${business.address}"`
      }),
    ].join("\n")

    // Add UTF-8 BOM for proper encoding of special characters
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `empresas_heroes_colombia_${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch =
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || business.status === statusFilter
    const matchesPlan = planFilter === "all" || business.plan?.toLowerCase() === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  // Fetch locations and analytics when modal opens
  useEffect(() => {
    if (!selectedBusiness?.id) {
      setModalLocations([])
      setModalAnalytics(null)
      return
    }

    const fetchModalData = async () => {
      setModalLoading(true)
      try {
        const [locations, analytics] = await Promise.all([
          LocationService.getBusinessLocations(selectedBusiness.id),
          AnalyticsEventService.getEventCountsByType(selectedBusiness.id),
        ])
        setModalLocations(locations || [])
        setModalAnalytics(analytics)
      } catch (error) {
        console.error("Error fetching modal data:", error)
      } finally {
        setModalLoading(false)
      }
    }

    fetchModalData()
  }, [selectedBusiness?.id])

  // Fetch resource counts for each business in cards
  useEffect(() => {
    const fetchCounts = async () => {
      // Fetch counts for businesses that don't have them yet
      const businessesToFetch = filteredBusinesses.slice(0, 20).filter((b) => !businessCounts[b.id])

      if (businessesToFetch.length === 0) return

      const newCounts: Record<string, { locations: number; promotions: number }> = {}

      await Promise.all(
        businessesToFetch.map(async (business) => {
          try {
            const locations = await LocationService.getBusinessLocations(business.id)

            const filters = {
              businessId: business.id,
            }
            const promotions = await PromotionService.getPromotions(filters)
            // For promotions count, we'd need to fetch, but let's keep it simple for now
            newCounts[business.id] = {
              locations: locations?.length || 0,
              promotions: promotions?.length || 0,
            }
          } catch (error) {
            console.error(`Error fetching counts for ${business.id}:`, error)
            newCounts[business.id] = { locations: 0, promotions: 0 }
          }
        })
      )

      setBusinessCounts((prev) => ({ ...prev, ...newCounts }))
    }

    fetchCounts()
  }, [filteredBusinesses.map((b) => b.id).join(","), businessCounts])

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "default",
      pending: "secondary",
      suspended: "destructive",
      rejected: "destructive",
    } as const

    const labels = {
      approved: "Aprobada",
      pending: "Pendiente",
      suspended: "Marcada",
      rejected: "Rechazada",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const getPlanBadge = (plan: string) => {
    const isPremium = plan === "Pro" || plan === "Enterprise"
    return (
      <Badge variant={isPremium ? "default" : "secondary"} className="flex items-center gap-1">
        {isPremium && <Crown className="h-3 w-3" />}
        {plan}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const config = {
      physical: { label: "Física", icon: Store, variant: "outline" as const },
      online: { label: "Online", icon: Globe, variant: "outline" as const },
      hybrid: { label: "Híbrida", icon: ShoppingBag, variant: "outline" as const },
    }

    const typeConfig = config[type as keyof typeof config] || config.physical
    const Icon = typeConfig.icon

    return (
      <Badge variant={typeConfig.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {typeConfig.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Empresas</h1>
          <p className="text-muted-foreground">Administra empresas registradas y solicitudes pendientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{businesses.filter((b) => b.status === "active").length} activas</Badge>
          <Badge variant="secondary">{businesses.filter((b) => b.status === "pending").length} pendientes</Badge>
          <Badge variant="destructive">{businesses.filter((b) => b.status === "suspended").length} marcadas</Badge>
          <Button onClick={exportBusinesses} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="approved">Aprobadas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="suspended">Marcadas</SelectItem>
            <SelectItem value="rejected">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los planes</SelectItem>
            <SelectItem value="básico">Básico</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Businesses List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Cargando empresas...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredBusinesses.map((business) => (
              <Card key={business.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold">{business.name}</h3>
                        {getStatusBadge(business.status)}
                        {getPlanBadge(business.plan || "basico")}
                        {getTypeBadge(business.type || "physical")}
                        {business.featured && <Badge variant="secondary">Destacado</Badge>}
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{business.address || "Sin dirección"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>{business.email}</span>
                          <Phone className="h-4 w-4 ml-2" />
                          <span>{business.phone_number || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          <span>{business.categories?.map((cat: string) => getCategoryName(cat)).join(", ") || "Sin categoría"}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground border-t pt-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="font-medium">{businessCounts[business.id]?.locations ?? "..."}</span> ubicaciones
                        </span>
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span className="font-medium">{businessCounts[business.id]?.promotions ?? "..."}</span> promociones
                        </span>
                        <span className="flex items-center gap-1 ml-auto">
                          <Calendar className="h-3 w-3" />
                          {business.created_at ? ((business.created_at as any).seconds ? new Date((business.created_at as any).seconds * 1000).toLocaleDateString() : new Date(business.created_at as Date).toLocaleDateString()) : "N/A"}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground mt-2">
                        Propietario: {business.owner_name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedBusiness(business)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalles de {business.name}</DialogTitle>
                          </DialogHeader>
                          {selectedBusiness && (
                            <Tabs defaultValue="info" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="info">Información General</TabsTrigger>
                                <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
                                <TabsTrigger value="promotions">Promociones y Analíticas</TabsTrigger>
                              </TabsList>
                              <TabsContent value="info" className="space-y-4 max-h-[60vh] overflow-y-auto">
                                {/* Business Information */}
                                <div>
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Información del Negocio
                                  </h4>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                                    <div>
                                      <span className="text-muted-foreground">Nombre:</span>
                                      <p className="font-medium">{selectedBusiness.name}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">NIT:</span>
                                      <p className="font-medium">{selectedBusiness.identification || "N/A"}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Tipo:</span>
                                      <p className="font-medium">{getTypeBadge(selectedBusiness.type || "physical")}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Destacado:</span>
                                      <p className="font-medium">{selectedBusiness.featured ? "Sí" : "No"}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">Categorías:</span>
                                      <div className="flex gap-1 mt-1 flex-wrap">
                                        {selectedBusiness.categories?.map((cat: string) => (
                                          <Badge key={cat} variant="secondary" className="text-xs">
                                            {getCategoryName(cat)}
                                          </Badge>
                                        )) || <span className="text-sm">Sin categoría</span>}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Contact Information */}
                                <div>
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Información de Contacto
                                  </h4>
                                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                                    <div>
                                      <span className="text-muted-foreground">Email:</span>
                                      <p className="font-medium">{selectedBusiness.email}</p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Teléfono:</span>
                                      <p className="font-medium">{selectedBusiness.phone_number || "N/A"}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">Sitio web:</span>
                                      <p className="font-medium">
                                        {selectedBusiness.website ? (
                                          <a href={selectedBusiness.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            {selectedBusiness.website}
                                          </a>
                                        ) : "N/A"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Propietario:</span>
                                      <p className="font-medium">{selectedBusiness.owner_name}</p>
                                    </div>
                                    <div className="col-span-2">
                                      <span className="text-muted-foreground">Dirección:</span>
                                      <p className="font-medium">{selectedBusiness.address || "N/A"}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Resource Usage */}
                                <div>
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Uso de Recursos
                                  </h4>
                                  <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
                                    {(() => {
                                      const planLimits = getPlanLimits(selectedBusiness.plan || "basico")
                                      const locationsCount = modalLocations.length
                                      const promotionsCount = promotions?.filter((p) => p.status === "active").length || 0
                                      const teamMembersCount = 0 // TODO: Fetch from team member service

                                      const getProgressColor = (current: number, max: number | null) => {
                                        if (!max) return "bg-primary"
                                        const percentage = (current / max) * 100
                                        if (percentage >= 90) return "bg-destructive"
                                        if (percentage >= 70) return "bg-yellow-500"
                                        return "bg-primary"
                                      }

                                      return (
                                        <>
                                          <div>
                                            <div className="flex justify-between text-sm mb-1">
                                              <span className="text-muted-foreground">Ubicaciones</span>
                                              <span className="font-medium">
                                                {locationsCount} / {planLimits.maxLocations === null ? "∞" : planLimits.maxLocations}
                                              </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                              <div
                                                className={`${getProgressColor(locationsCount, planLimits.maxLocations)} h-2 rounded-full transition-all`}
                                                style={{
                                                  width: planLimits.maxLocations
                                                    ? `${Math.min((locationsCount / planLimits.maxLocations) * 100, 100)}%`
                                                    : "0%",
                                                }}
                                              ></div>
                                            </div>
                                          </div>
                                          <div>
                                            <div className="flex justify-between text-sm mb-1">
                                              <span className="text-muted-foreground">Promociones activas</span>
                                              <span className="font-medium">
                                                {promotionsCount} /{" "}
                                                {planLimits.maxActivePromotions === null ? "Por pago" : planLimits.maxActivePromotions}
                                              </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                              <div
                                                className={`${getProgressColor(promotionsCount, planLimits.maxActivePromotions)} h-2 rounded-full transition-all`}
                                                style={{
                                                  width: planLimits.maxActivePromotions
                                                    ? `${Math.min((promotionsCount / planLimits.maxActivePromotions) * 100, 100)}%`
                                                    : "0%",
                                                }}
                                              ></div>
                                            </div>
                                          </div>
                                          <div>
                                            <div className="flex justify-between text-sm mb-1">
                                              <span className="text-muted-foreground">Miembros del equipo</span>
                                              <span className="font-medium">
                                                {teamMembersCount} / {planLimits.maxUsers}
                                              </span>
                                            </div>
                                            <div className="w-full bg-muted rounded-full h-2">
                                              <div
                                                className={`${getProgressColor(teamMembersCount, planLimits.maxUsers)} h-2 rounded-full transition-all`}
                                                style={{
                                                  width: `${Math.min((teamMembersCount / planLimits.maxUsers) * 100, 100)}%`,
                                                }}
                                              ></div>
                                            </div>
                                          </div>
                                        </>
                                      )
                                    })()}
                                  </div>
                                </div>
                              </TabsContent>

                              {/* Locations Tab */}
                              <TabsContent value="locations" className="space-y-4 max-h-[60vh] overflow-y-auto">
                                <div className="flex items-center justify-between mb-4">
                                  <p className="text-sm text-muted-foreground">
                                    {modalLocations.length > 0
                                      ? `${modalLocations.length} ubicación${modalLocations.length > 1 ? "es" : ""} (${modalLocations.filter((l) => l.is_primary).length
                                      } principal${modalLocations.filter((l) => l.is_primary).length > 1 ? "es" : ""})`
                                      : "Ubicaciones configuradas para este negocio"}
                                  </p>
                                </div>

                                {modalLoading ? (
                                  <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                  </div>
                                ) : modalLocations.length === 0 ? (
                                  <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No hay ubicaciones configuradas</h3>
                                    <p className="text-muted-foreground text-sm">
                                      Este negocio aún no ha configurado ubicaciones
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {modalLocations.map((location) => (
                                      <Card key={location.id}>
                                        <CardContent className="p-4">
                                          <div className="space-y-3">
                                            <div className="flex items-start justify-between">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <h5 className="font-semibold">{location.name}</h5>
                                                {location.is_primary && <Badge variant="default">Principal</Badge>}
                                                <Badge variant="outline">{location.type === "physical" ? "Física" : "Online"}</Badge>
                                                <Badge variant={location.status === "active" ? "default" : "secondary"}>
                                                  {location.status === "active" ? "Activa" : "Inactiva"}
                                                </Badge>
                                              </div>
                                            </div>

                                            {location.type === "physical" && location.address && (
                                              <div className="space-y-2 text-sm">
                                                <div className="flex items-start gap-2">
                                                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                  <span>{location.address}</span>
                                                </div>
                                                {location.business_hours && location.business_hours.length > 0 && (
                                                  <div className="flex items-start gap-2">
                                                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                    <div className="flex-1">
                                                      <p className="font-medium mb-1">Horario de atención:</p>
                                                      <div className="space-y-0.5 text-muted-foreground">
                                                        {formatBusinessHours(location.business_hours).map((hours, idx) => (
                                                          <div key={idx}>{hours}</div>
                                                        ))}
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            {location.type === "online" && (
                                              <div className="space-y-2 text-sm">
                                                {location.delivery_zones && location.delivery_zones.length > 0 && (
                                                  <div>
                                                    <p className="font-medium">Zonas de entrega:</p>
                                                    <p className="text-muted-foreground">{location.delivery_zones.join(", ")}</p>
                                                  </div>
                                                )}
                                                {location.shipping_info && (
                                                  <div>
                                                    <p className="font-medium">Información de envío:</p>
                                                    <p className="text-muted-foreground">{location.shipping_info}</p>
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            {(location.phone || location.email || location.website) && (
                                              <div className="flex gap-4 text-sm text-muted-foreground border-t pt-2">
                                                {location.phone && (
                                                  <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {location.phone}
                                                  </span>
                                                )}
                                                {location.email && (
                                                  <span className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {location.email}
                                                  </span>
                                                )}
                                                {location.website && (
                                                  <a
                                                    href={location.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-primary hover:underline"
                                                  >
                                                    <Globe className="h-3 w-3" />
                                                    Sitio web
                                                  </a>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                )}
                              </TabsContent>

                              {/* Promotions & Analytics Tab */}
                              <TabsContent value="promotions" className="space-y-4 max-h-[60vh] overflow-y-auto">
                                {/* Promotions Section */}
                                <div>
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Tag className="h-4 w-4" />
                                    Promociones
                                  </h4>

                                  {modalLoading ? (
                                    <div className="flex justify-center py-8">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    </div>
                                  ) : !promotions || promotions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/30 rounded-lg">
                                      <Tag className="h-10 w-10 text-muted-foreground mb-3" />
                                      <p className="text-sm text-muted-foreground">No hay promociones creadas aún</p>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex gap-4 mb-4 text-sm">
                                        <span>
                                          Total: <strong>{promotions.length}</strong>
                                        </span>
                                        <span>
                                          Activas: <strong>{promotions.filter((p) => p.status === "active").length}</strong>
                                        </span>
                                        <span>
                                          Vencidas: <strong>{promotions.filter((p) => p.status === "inactive").length}</strong>
                                        </span>
                                      </div>

                                      <div className="space-y-3">
                                        {promotions.slice(0, 5).map((promo) => (
                                          <Card key={promo.id}>
                                            <CardContent className="p-3">
                                              <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <h6 className="font-semibold text-sm">{promo.title}</h6>
                                                    <Badge variant={promo.status === "active" ? "default" : "secondary"} className="text-xs">
                                                      {promo.status === "active" ? "Activa" : "Vencida"}
                                                    </Badge>
                                                    {promo.is_featured && (
                                                      <Badge variant="secondary" className="text-xs">
                                                        Destacada
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  <p className="text-lg font-bold text-primary">{promo.percentage}% OFF</p>
                                                  <p className="text-xs text-muted-foreground">
                                                    Válida hasta: {promo.expired_at ? formatDate(promo.expired_at) : "N/A"}
                                                  </p>
                                                </div>
                                              </div>
                                              <div className="flex gap-4 text-xs text-muted-foreground border-t pt-2">
                                                <span className="flex items-center gap-1">
                                                  <Eye className="h-3 w-3" />
                                                  {promo.views_count || 0} vistas
                                                </span>
                                                <span className="flex items-center gap-1">
                                                  <Tag className="h-3 w-3" />
                                                  {promo.saves_count || 0} guardados
                                                </span>
                                                <span className="flex items-center gap-1">
                                                  <CheckCircle className="h-3 w-3" />
                                                  {promo.redemptions_count || 0} redenciones
                                                </span>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                        {promotions.length > 5 && (
                                          <p className="text-xs text-center text-muted-foreground">
                                            Mostrando 5 de {promotions.length} promociones
                                          </p>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>

                                {/* Analytics Section */}
                                <div>
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Analíticas
                                  </h4>

                                  <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                                    <div className="text-center">
                                      <p className="text-2xl font-bold">{modalAnalytics?.impressions || 0}</p>
                                      <p className="text-xs text-muted-foreground">Impresiones</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-2xl font-bold">{modalAnalytics?.views || 0}</p>
                                      <p className="text-xs text-muted-foreground">Vistas</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-2xl font-bold">{modalAnalytics?.saves || 0}</p>
                                      <p className="text-xs text-muted-foreground">Guardados</p>
                                    </div>
                                    <div className="text-center">
                                      <p className="text-2xl font-bold">{modalAnalytics?.redemptions || 0}</p>
                                      <p className="text-xs text-muted-foreground">Redenciones</p>
                                    </div>
                                  </div>

                                  {/* Activity Timestamps */}
                                  <div className="mt-4 space-y-2 text-sm bg-muted/30 p-3 rounded-lg">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4" />
                                      <span className="text-muted-foreground">Registrado:</span>
                                      <span className="font-medium">{formatDate(selectedBusiness.created_at)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4" />
                                      <span className="text-muted-foreground">Última actualización:</span>
                                      <span className="font-medium">{formatDate(selectedBusiness.updated_at)}</span>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>

                      {business.status === "pending" && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(business.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleReject(business.id)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </>
                      )}

                      {business.status === "approved" && (
                        <Button variant="outline" size="sm" onClick={() => handleFlag(business.id)}>
                          Marcar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {filteredBusinesses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron empresas</h3>
            <p className="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
