"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, MapPin, Globe, Clock, Edit, Trash2, MoreHorizontal, Crown } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { seedLocations, colombianCities } from "@/lib/seed-data"
import type { BusinessLocation, BusinessHours } from "@/lib/types"

// Mock data with proper typing
const mockLocations: BusinessLocation[] = [
  {
    id: "loc_001",
    businessId: "current_business",
    name: "Sede Principal - Zona Rosa",
    type: "physical",
    address: {
      street: "Carrera 13 #85-32",
      city: "Bogotá",
      state: "Cundinamarca",
      zipCode: "110221",
      country: "Colombia",
    },
    coordinates: {
      latitude: 4.6628,
      longitude: -74.0583,
    },
    businessHours: [
      { dayOfWeek: 1, isOpen: true, openTime: "11:00", closeTime: "22:00" },
      { dayOfWeek: 2, isOpen: true, openTime: "11:00", closeTime: "22:00" },
      { dayOfWeek: 3, isOpen: true, openTime: "11:00", closeTime: "22:00" },
      { dayOfWeek: 4, isOpen: true, openTime: "11:00", closeTime: "22:00" },
      { dayOfWeek: 5, isOpen: true, openTime: "11:00", closeTime: "23:00" },
      { dayOfWeek: 6, isOpen: true, openTime: "11:00", closeTime: "23:00" },
      { dayOfWeek: 0, isOpen: true, openTime: "11:00", closeTime: "21:00" },
    ],
    isActive: true,
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-05-15"),
  },
  {
    id: "loc_002",
    businessId: "current_business",
    name: "Tienda Online",
    type: "online",
    website: "https://mitienda.com",
    deliveryZones: ["Zona Norte", "Zona Rosa", "Centro", "Chapinero"],
    onlineContactInfo: {
      phone: "+57 301 234 5678",
      email: "online@mitienda.com",
      whatsapp: "+57 301 234 5678",
    },
    isActive: true,
    createdAt: new Date("2024-05-16"),
    updatedAt: new Date("2024-05-16"),
  },
]

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export default function LocationsPage() {
  const [locations, setLocations] = useState(mockLocations)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newLocation, setNewLocation] = useState({
    name: "",
    type: "physical" as "physical" | "online",
    address: {
      street: "",
      city: "",
      state: "Cundinamarca",
      zipCode: "",
      country: "Colombia",
    },
    website: "",
    deliveryZones: [] as string[],
    onlineContactInfo: {
      phone: "",
      email: "",
      whatsapp: "",
    },
    businessHours: Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i,
      isOpen: i > 0 && i < 6, // Monday to Friday open by default
      openTime: "09:00",
      closeTime: "18:00",
    })) as BusinessHours[],
  })

  const { user } = useAuth()
  const businessUser = user as any
  const plan = businessUser?.plan || "gratis"
  const isPremium = plan === "pro" || plan === "enterprise"

  const filteredLocations = locations.filter((location) => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || location.type === typeFilter
    return matchesSearch && matchesType
  })

  const getLocationLimits = () => {
    switch (plan) {
      case "gratis":
      case "basico":
        return 1
      case "pro":
        return 5
      case "enterprise":
        return Number.POSITIVE_INFINITY
      default:
        return 1
    }
  }

  const locationLimit = getLocationLimits()
  const canAddLocation = locations.length < locationLimit

  const getTypeBadge = (type: "physical" | "online") => {
    return type === "physical" ? (
      <Badge variant="default" className="gap-1">
        <MapPin className="h-3 w-3" />
        Física
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <Globe className="h-3 w-3" />
        Online
      </Badge>
    )
  }

  const handleCreateLocation = () => {
    const newLocationData: BusinessLocation = {
      id: `loc_${Date.now()}`,
      businessId: businessUser?.businessId || "current_business",
      ...newLocation,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setLocations((prev) => [...prev, newLocationData])
    setIsCreateDialogOpen(false)

    // Reset form
    setNewLocation({
      name: "",
      type: "physical",
      address: { street: "", city: "", state: "Cundinamarca", zipCode: "", country: "Colombia" },
      website: "",
      deliveryZones: [],
      onlineContactInfo: { phone: "", email: "", whatsapp: "" },
      businessHours: Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i,
        isOpen: i > 0 && i < 6,
        openTime: "09:00",
        closeTime: "18:00",
      })),
    })
  }

  const updateBusinessHours = (dayIndex: number, field: keyof BusinessHours, value: any) => {
    setNewLocation((prev) => ({
      ...prev,
      businessHours: prev.businessHours.map((hours, index) =>
        index === dayIndex ? { ...hours, [field]: value } : hours
      ),
    }))
  }

  const formatBusinessHours = (hours: BusinessHours[] | undefined) => {
    if (!hours) return "No configurado"

    const openDays = hours.filter((h) => h.isOpen)
    if (openDays.length === 0) return "Cerrado"

    // Group consecutive days with same hours
    const groups: { days: string; hours: string }[] = []
    let currentGroup: number[] = []
    let currentHours = ""

    for (let i = 0; i < 7; i++) {
      const day = hours.find((h) => h.dayOfWeek === i)
      if (day?.isOpen) {
        const dayHours = `${day.openTime} - ${day.closeTime}`

        if (currentHours === dayHours) {
          currentGroup.push(i)
        } else {
          if (currentGroup.length > 0) {
            groups.push({
              days: formatDayRange(currentGroup),
              hours: currentHours,
            })
          }
          currentGroup = [i]
          currentHours = dayHours
        }
      }
    }

    if (currentGroup.length > 0) {
      groups.push({
        days: formatDayRange(currentGroup),
        hours: currentHours,
      })
    }

    return groups.map((g) => `${g.days}: ${g.hours}`).join(" • ")
  }

  const formatDayRange = (days: number[]): string => {
    if (days.length === 1) return dayNames[days[0]]
    if (days.length === 2) return `${dayNames[days[0]]} y ${dayNames[days[1]]}`

    // Check if consecutive
    const isConsecutive = days.every((day, i) => i === 0 || day === days[i - 1] + 1)
    if (isConsecutive && days.length > 2) {
      return `${dayNames[days[0]]} - ${dayNames[days[days.length - 1]]}`
    }

    return days.map((day) => dayNames[day]).join(", ")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ubicaciones</h1>
          <p className="text-muted-foreground">Gestiona tus ubicaciones físicas y online</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {locations.length}/{locationLimit === Number.POSITIVE_INFINITY ? "∞" : locationLimit} ubicaciones
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canAddLocation}>
                <Plus className="h-4 w-4 mr-1" />
                Nueva Ubicación
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nueva Ubicación</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location-name">Nombre de la ubicación</Label>
                    <Input
                      id="location-name"
                      placeholder="Ej: Sede Principal, Tienda Online"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-type">Tipo de ubicación</Label>
                    <Select
                      value={newLocation.type}
                      onValueChange={(value: "physical" | "online") =>
                        setNewLocation((prev) => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="physical">Ubicación Física</SelectItem>
                        <SelectItem value="online">Tienda Online</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Tabs value={newLocation.type} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="physical">Ubicación Física</TabsTrigger>
                    <TabsTrigger value="online">Tienda Online</TabsTrigger>
                  </TabsList>

                  <TabsContent value="physical" className="space-y-4">
                    {/* Address Information */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Información de Dirección</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="street">Dirección</Label>
                          <Input
                            id="street"
                            placeholder="Ej: Carrera 13 #85-32"
                            value={newLocation.address.street}
                            onChange={(e) =>
                              setNewLocation((prev) => ({
                                ...prev,
                                address: { ...prev.address, street: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">Ciudad</Label>
                          <Select
                            value={newLocation.address.city}
                            onValueChange={(value) =>
                              setNewLocation((prev) => ({
                                ...prev,
                                address: { ...prev.address, city: value },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar ciudad" />
                            </SelectTrigger>
                            <SelectContent>
                              {colombianCities.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">Código Postal</Label>
                          <Input
                            id="zipCode"
                            placeholder="110221"
                            value={newLocation.address.zipCode}
                            onChange={(e) =>
                              setNewLocation((prev) => ({
                                ...prev,
                                address: { ...prev.address, zipCode: e.target.value },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Hours */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Horarios de Atención</h3>
                      <div className="space-y-3">
                        {newLocation.businessHours.map((hours, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-20 text-sm font-medium">{dayNames[hours.dayOfWeek]}</div>
                            <Switch
                              checked={hours.isOpen}
                              onCheckedChange={(checked) => updateBusinessHours(index, "isOpen", checked)}
                            />
                            {hours.isOpen && (
                              <>
                                <Input
                                  type="time"
                                  value={hours.openTime}
                                  onChange={(e) => updateBusinessHours(index, "openTime", e.target.value)}
                                  className="w-32"
                                />
                                <span className="text-muted-foreground">a</span>
                                <Input
                                  type="time"
                                  value={hours.closeTime}
                                  onChange={(e) => updateBusinessHours(index, "closeTime", e.target.value)}
                                  className="w-32"
                                />
                              </>
                            )}
                            {!hours.isOpen && <span className="text-sm text-muted-foreground">Cerrado</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="online" className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="font-medium">Información Online</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="website">Sitio Web</Label>
                          <Input
                            id="website"
                            type="url"
                            placeholder="https://mitienda.com"
                            value={newLocation.website}
                            onChange={(e) => setNewLocation((prev) => ({ ...prev, website: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="delivery-zones">Zonas de Entrega</Label>
                          <Textarea
                            id="delivery-zones"
                            placeholder="Ej: Zona Norte, Zona Rosa, Centro (separadas por comas)"
                            value={newLocation.deliveryZones.join(", ")}
                            onChange={(e) =>
                              setNewLocation((prev) => ({
                                ...prev,
                                deliveryZones: e.target.value.split(",").map((zone) => zone.trim()),
                              }))
                            }
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="online-phone">Teléfono</Label>
                            <Input
                              id="online-phone"
                              placeholder="+57 300 123 4567"
                              value={newLocation.onlineContactInfo.phone}
                              onChange={(e) =>
                                setNewLocation((prev) => ({
                                  ...prev,
                                  onlineContactInfo: { ...prev.onlineContactInfo, phone: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="online-whatsapp">WhatsApp</Label>
                            <Input
                              id="online-whatsapp"
                              placeholder="+57 300 123 4567"
                              value={newLocation.onlineContactInfo.whatsapp}
                              onChange={(e) =>
                                setNewLocation((prev) => ({
                                  ...prev,
                                  onlineContactInfo: { ...prev.onlineContactInfo, whatsapp: e.target.value },
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="online-email">Email de Contacto</Label>
                          <Input
                            id="online-email"
                            type="email"
                            placeholder="contacto@mitienda.com"
                            value={newLocation.onlineContactInfo.email}
                            onChange={(e) =>
                              setNewLocation((prev) => ({
                                ...prev,
                                onlineContactInfo: { ...prev.onlineContactInfo, email: e.target.value },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateLocation}>Crear Ubicación</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Plan Limits Warning */}
      {!canAddLocation && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Límite de ubicaciones alcanzado</p>
                <p className="text-sm text-yellow-700">
                  Tu plan {plan} permite hasta {locationLimit} ubicación{locationLimit > 1 ? "es" : ""}.
                  <span className="underline cursor-pointer ml-1">Actualizar plan</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar ubicaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="physical">Físicas</SelectItem>
            <SelectItem value="online">Online</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Locations List */}
      <div className="space-y-4">
        {filteredLocations.map((location) => (
          <Card key={location.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{location.name}</h3>
                    {getTypeBadge(location.type)}
                  </div>

                  {location.type === "physical" && location.address && (
                    <div className="space-y-1 mb-4">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {location.address.street}, {location.address.city}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatBusinessHours(location.businessHours)}
                      </p>
                    </div>
                  )}

                  {location.type === "online" && (
                    <div className="space-y-1 mb-4">
                      {location.website && (
                        <p className="text-muted-foreground flex items-center gap-1">
                          <Globe className="h-4 w-4" />
                          <a href={location.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {location.website}
                          </a>
                        </p>
                      )}
                      {location.deliveryZones && location.deliveryZones.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Zonas de entrega: {location.deliveryZones.join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
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
      {filteredLocations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No se encontraron ubicaciones</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || typeFilter !== "all"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Agrega tu primera ubicación para comenzar"}
              </p>
              {!searchTerm && typeFilter === "all" && canAddLocation && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Crear Primera Ubicación
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}