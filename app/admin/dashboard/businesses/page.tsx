"use client"

import { useState } from "react"
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
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Phone,
  Mail,
  Crown,
} from "lucide-react"

// Mock data
const mockBusinesses = [
  {
    id: "1",
    name: "Restaurante El Dorado",
    email: "contacto@eldorado.com",
    phone: "+57 300 123 4567",
    category: "Restaurante",
    plan: "Enterprise",
    status: "approved",
    registrationDate: new Date("2024-01-15"),
    lastActivity: new Date("2024-01-20"),
    revenue: 45000,
    promotions: 12,
    locations: 3,
    documents: ["rut", "camara_comercio", "cedula"],
    address: "Calle 123 #45-67, Bogotá",
  },
  {
    id: "2",
    name: "Tienda Fashion Plus",
    email: "info@fashionplus.com",
    phone: "+57 301 234 5678",
    category: "Retail",
    plan: "Pro",
    status: "pending",
    registrationDate: new Date("2024-01-18"),
    lastActivity: new Date("2024-01-19"),
    revenue: 32000,
    promotions: 8,
    locations: 2,
    documents: ["rut", "camara_comercio"],
    address: "Carrera 45 #67-89, Medellín",
  },
  {
    id: "3",
    name: "Café Central",
    email: "hola@cafecentral.com",
    phone: "+57 302 345 6789",
    category: "Restaurante",
    plan: "Básico",
    status: "flagged",
    registrationDate: new Date("2024-01-20"),
    lastActivity: new Date("2024-01-21"),
    revenue: 15000,
    promotions: 3,
    locations: 1,
    documents: ["rut"],
    address: "Avenida 67 #89-12, Cali",
  },
]

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState(mockBusinesses)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [planFilter, setPlanFilter] = useState("all")
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null)

  const filteredBusinesses = businesses.filter((business) => {
    const matchesSearch =
      business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || business.status === statusFilter
    const matchesPlan = planFilter === "all" || business.plan.toLowerCase() === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: "default",
      pending: "secondary",
      flagged: "destructive",
      rejected: "destructive",
    } as const

    const labels = {
      approved: "Aprobada",
      pending: "Pendiente",
      flagged: "Marcada",
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

  const handleApprove = (businessId: string) => {
    setBusinesses((prev) => prev.map((b) => (b.id === businessId ? { ...b, status: "approved" } : b)))
  }

  const handleReject = (businessId: string) => {
    setBusinesses((prev) => prev.map((b) => (b.id === businessId ? { ...b, status: "rejected" } : b)))
  }

  const handleFlag = (businessId: string) => {
    setBusinesses((prev) => prev.map((b) => (b.id === businessId ? { ...b, status: "flagged" } : b)))
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
          <Badge variant="destructive">{businesses.filter((b) => b.status === "flagged").length} marcadas</Badge>
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
            <SelectItem value="flagged">Marcadas</SelectItem>
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
        {filteredBusinesses.map((business) => (
          <Card key={business.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{business.name}</h3>
                    {getStatusBadge(business.status)}
                    {getPlanBadge(business.plan)}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {business.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {business.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {business.address}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {business.category}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Registrado: {business.registrationDate.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Ingresos: ${business.revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span>{business.promotions} promociones</span>
                    <span>{business.locations} ubicaciones</span>
                    <span>{business.documents.length} documentos</span>
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
                                    <span className="font-medium">Teléfono:</span> {selectedBusiness.phone}
                                  </div>
                                  <div>
                                    <span className="font-medium">Categoría:</span> {selectedBusiness.category}
                                  </div>
                                  <div>
                                    <span className="font-medium">Plan:</span> {selectedBusiness.plan}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Métricas</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Promociones:</span> {selectedBusiness.promotions}
                                  </div>
                                  <div>
                                    <span className="font-medium">Ubicaciones:</span> {selectedBusiness.locations}
                                  </div>
                                  <div>
                                    <span className="font-medium">Ingresos:</span> $
                                    {selectedBusiness.revenue.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="documents" className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Documentos Subidos</h4>
                              <div className="space-y-2">
                                {selectedBusiness.documents.map((doc: string, index: number) => (
                                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                    <FileText className="h-4 w-4" />
                                    <span className="text-sm">{doc.replace("_", " ").toUpperCase()}</span>
                                    <Button variant="ghost" size="sm" className="ml-auto">
                                      Ver
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="activity" className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Actividad Reciente</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  Última actividad: {selectedBusiness.lastActivity.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Registro: {selectedBusiness.registrationDate.toLocaleString()}
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
