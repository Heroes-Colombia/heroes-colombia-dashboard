"use client"

import { useState } from "react"
import { useCategories } from "@/hooks/use-categories"
import { useBusinesses } from "@/hooks/use-businesses"
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
  FileText,
  Phone,
  Mail,
  Crown,
} from "lucide-react"


export default function AdminBusinessesPage() {
  const { getCategoryName } = useCategories()
  const { businesses, isLoading, refreshBusinesses, updateBusinessStatus } = useBusinesses()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null)

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

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch =
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || business.status === statusFilter
    const matchesPlan = planFilter === "all" || business.plan?.toLowerCase() === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Empresas</h1>
          <p className="text-muted-foreground">Administra empresas registradas y solicitudes pendientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{businesses.filter((b) => b.status === "pending").length} pendientes</Badge>
          <Badge variant="destructive">{businesses.filter((b) => b.status === "suspended").length} marcadas</Badge>
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
            <SelectItem value="gratis">Gratis</SelectItem>
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
        ) : filteredBusinesses.map((business) => (
          <Card key={business.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{business.name}</h3>
                    {getStatusBadge(business.status)}
                    {getPlanBadge(business.plan || "gratis")}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {business.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {business.phone_number || "N/A"}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {business.address}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {business.categories?.map((cat: string) => getCategoryName(cat)).join(", ") || "Sin categoría"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Registrado: {business.created_at ? ((business.created_at as any).seconds ? new Date((business.created_at as any).seconds * 1000).toLocaleDateString() : new Date(business.created_at as Date).toLocaleDateString()) : "N/A"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {business.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span>Propietario: {business.owner_name}</span>
                    <span>Tel: {business.phone_number}</span>
                    {business.featured && <Badge variant="secondary">Destacado</Badge>}
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
                            <TabsTrigger value="info">Información</TabsTrigger>
                            <TabsTrigger value="documents">Documentos</TabsTrigger>
                            <TabsTrigger value="activity">Actividad</TabsTrigger>
                          </TabsList>
                          <TabsContent value="info" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Información Básica</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Email:</span> {selectedBusiness.email}
                                  </div>
                                  <div>
                                    <span className="font-medium">Teléfono:</span> {selectedBusiness.phone_number || selectedBusiness.phoneNumber || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Categorías:</span> {selectedBusiness.categories?.map((cat: string) => getCategoryName(cat)).join(", ") || "Sin categoría"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Plan:</span> {selectedBusiness.plan || "No asignado"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Propietario:</span> {selectedBusiness.owner_name}
                                  </div>
                                  <div>
                                    <span className="font-medium">Dirección:</span> {selectedBusiness.address}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Estado</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Estado:</span> {selectedBusiness.status}
                                  </div>
                                  <div>
                                    <span className="font-medium">Destacado:</span> {selectedBusiness.featured ? "Sí" : "No"}
                                  </div>
                                  <div>
                                    <span className="font-medium">Reseñas:</span> {selectedBusiness.reviews?.length || 0}
                                  </div>
                                  <div>
                                    <span className="font-medium">NIT:</span> {selectedBusiness.identification}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="documents" className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Documentos Subidos</h4>
                              <div className="space-y-2">
                                {selectedBusiness.verificationDocuments && selectedBusiness.verificationDocuments.length > 0 ? (
                                  selectedBusiness.verificationDocuments.map((doc: string, index: number) => (
                                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                      <FileText className="h-4 w-4" />
                                      <span className="text-sm">{doc.replace("_", " ").toUpperCase()}</span>
                                      <Button variant="ghost" size="sm" className="ml-auto">
                                        Ver
                                      </Button>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground">No hay documentos subidos</p>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="activity" className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Actividad Reciente</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Última actividad: {selectedBusiness.lastActiveAt ? ((selectedBusiness.lastActiveAt as any).seconds ? new Date((selectedBusiness.lastActiveAt as any).seconds * 1000).toLocaleString() : new Date(selectedBusiness.lastActiveAt as Date).toLocaleString()) : "N/A"}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Registro: {selectedBusiness.createdAt ? ((selectedBusiness.createdAt as any).seconds ? new Date((selectedBusiness.createdAt as any).seconds * 1000).toLocaleString() : new Date(selectedBusiness.createdAt as Date).toLocaleString()) : "N/A"}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Última actualización: {selectedBusiness.updatedAt ? ((selectedBusiness.updatedAt as any).seconds ? new Date((selectedBusiness.updatedAt as any).seconds * 1000).toLocaleString() : new Date(selectedBusiness.updatedAt as Date).toLocaleString()) : "N/A"}
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
