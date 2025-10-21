"use client"

import { useState, useEffect } from "react"
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
import { Plus, Search, Filter, MapPin, Globe, Clock, Edit, Trash2, MoreHorizontal, Star, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { colombianCities } from "@/lib/seed-data"
import { getPlanLimits } from "@/lib/plan-limits"
import { PlanLimitBadge, PlanLimitProgress } from "@/components/plan-limit-badge"
import { UpgradePlanButton } from "@/components/upgrade-plan-button"
import { LockedFeature } from "@/components/locked-feature"
import { LocationService } from "@/lib/services/location-service"
import type { BusinessLocation, BusinessHours, PlanType } from "@/lib/types"

const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newLocation, setNewLocation] = useState({
    name: "",
    type: "physical" as "physical" | "online",
    isPrimary: false,
    // Contact fields (all locations)
    phone: "",
    email: "",
    website: "",
    // Physical fields
    address: "",
    city: "",
    zipCode: "",
    // Online fields
    deliveryZones: [] as string[],
    shippingInfo: "",
    businessHours: Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      is_open: i > 0 && i < 6, // Monday to Friday open by default
      open_time: "09:00",
      close_time: "18:00",
    })) as BusinessHours[],
  })

  const { user } = useAuth()
  const businessUser = user as any
  const plan: PlanType = businessUser?.plan || "gratis"
  const limits = getPlanLimits(plan)
  const businessId = businessUser?.businessId || businessUser?.id

  // Fetch locations from Firebase
  useEffect(() => {
    const fetchLocations = async () => {
      if (!businessId) return

      setIsLoading(true)
      try {
        const fetchedLocations = await LocationService.getBusinessLocations(businessId)
        setLocations(fetchedLocations)
      } catch (error) {
        console.error("Error fetching locations:", error)
        alert("Error: No se pudieron cargar las ubicaciones")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLocations()
  }, [businessId])

  const filteredLocations = locations.filter((location) => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "all" || location.type === typeFilter
    return matchesSearch && matchesType
  })

  const locationLimit = limits.maxLocations === Infinity ? Infinity : limits.maxLocations
  const canAddLocation = locations.length < locationLimit
  const primaryLocation = locations.find((loc) => loc.isPrimary)

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

  const handleCreateLocation = async () => {
    if (!businessId) return

    // Validation: Must have at least one primary location
    const willBePrimary = locations.length === 0 || newLocation.isPrimary

    const newLocationData = {
      name: newLocation.name,
      is_primary: willBePrimary,
      type: newLocation.type,
      // Contact fields
      phone: newLocation.phone || null,
      email: newLocation.email || null,
      website: newLocation.website || null,
      // Physical fields
      address: newLocation.type === "physical" ? newLocation.address : null,
      location:
        newLocation.type === "physical"
          ? {
              latitude: 4.6097, // TODO: Get from map picker
              longitude: -74.0817,
            }
          : null,
      geo_hash: newLocation.type === "physical" ? null : null, // TODO: Generate geohash
      business_hours: newLocation.type === "physical" ? newLocation.businessHours : null,
      // Online fields
      delivery_zones: newLocation.type === "online" ? newLocation.deliveryZones : null,
      shipping_info: newLocation.type === "online" ? newLocation.shippingInfo : null,
      status: "active",
    }

    try {
      const locationId = await LocationService.createLocation(businessId, newLocationData)

      if (locationId) {
        // If this is primary, set it as primary (which will handle unsetting others)
        if (willBePrimary) {
          await LocationService.setPrimaryLocation(businessId, locationId)
        }

        // Refresh locations
        const fetchedLocations = await LocationService.getBusinessLocations(businessId)
        setLocations(fetchedLocations)

        alert("Ubicación creada exitosamente")

        setIsCreateDialogOpen(false)

        // Reset form
        setNewLocation({
          name: "",
          type: "physical",
          isPrimary: false,
          phone: "",
          email: "",
          website: "",
          address: "",
          city: "",
          zipCode: "",
          deliveryZones: [],
          shippingInfo: "",
          businessHours: Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i,
            is_open: i > 0 && i < 6,
            open_time: "09:00",
            close_time: "18:00",
          })),
        })
      }
    } catch (error) {
      console.error("Error creating location:", error)
      alert("Error: No se pudo crear la ubicación")
    }
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

    const openDays = hours.filter((h) => h.is_open)
    if (openDays.length === 0) return "Cerrado"

    // Group consecutive days with same hours
    const groups: { days: string; hours: string }[] = []
    let currentGroup: number[] = []
    let currentHours = ""

    for (let i = 0; i < 7; i++) {
      const day = hours.find((h) => h.day_of_week === i)
      if (day?.is_open) {
        const dayHours = `${day.open_time} - ${day.close_time}`

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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando ubicaciones...</span>
      </div>
    )
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
          <PlanLimitBadge plan={plan} resourceType="locations" currentCount={locations.length} showIcon />
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
                {/* Primary Location Notice */}
                {locations.length === 0 && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Primera ubicación</p>
                        <p className="text-sm text-blue-700">
                          Esta será tu ubicación principal. Aparecerá en los resultados de búsqueda y mapas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location-name">Nombre de la ubicación *</Label>
                    <Input
                      id="location-name"
                      placeholder="Ej: Sede Principal, Tienda Online"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-type">Tipo de ubicación *</Label>
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

                {/* Primary Location Toggle (only if not first location) */}
                {locations.length > 0 && (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Ubicación principal</Label>
                      <p className="text-sm text-muted-foreground">
                        Aparecerá en búsquedas y mapas. Solo puede haber una ubicación principal.
                      </p>
                    </div>
                    <Switch
                      checked={newLocation.isPrimary}
                      onCheckedChange={(checked) => setNewLocation((prev) => ({ ...prev, isPrimary: checked }))}
                    />
                  </div>
                )}

                {/* Contact Information (ALL locations have these fields - Schema V2) */}
                <div className="space-y-4">
                  <h3 className="font-medium">Información de Contacto</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        placeholder="+57 300 123 4567"
                        value={newLocation.phone}
                        onChange={(e) => setNewLocation((prev) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contacto@mitienda.com"
                        value={newLocation.email}
                        onChange={(e) => setNewLocation((prev) => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="website">Sitio Web</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://mitienda.com"
                        value={newLocation.website}
                        onChange={(e) => setNewLocation((prev) => ({ ...prev, website: e.target.value }))}
                      />
                    </div>
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
                          <Label htmlFor="address">Dirección *</Label>
                          <Input
                            id="address"
                            placeholder="Ej: Carrera 13 #85-32"
                            value={newLocation.address}
                            onChange={(e) => setNewLocation((prev) => ({ ...prev, address: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">Ciudad *</Label>
                          <Select
                            value={newLocation.city}
                            onValueChange={(value) => setNewLocation((prev) => ({ ...prev, city: value }))}
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
                            value={newLocation.zipCode}
                            onChange={(e) => setNewLocation((prev) => ({ ...prev, zipCode: e.target.value }))}
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
                            <div className="w-20 text-sm font-medium">{dayNames[hours.day_of_week]}</div>
                            <Switch
                              checked={hours.is_open}
                              onCheckedChange={(checked) => updateBusinessHours(index, "is_open", checked)}
                            />
                            {hours.is_open && (
                              <>
                                <Input
                                  type="time"
                                  value={hours.open_time}
                                  onChange={(e) => updateBusinessHours(index, "open_time", e.target.value)}
                                  className="w-32"
                                />
                                <span className="text-muted-foreground">a</span>
                                <Input
                                  type="time"
                                  value={hours.close_time}
                                  onChange={(e) => updateBusinessHours(index, "close_time", e.target.value)}
                                  className="w-32"
                                />
                              </>
                            )}
                            {!hours.is_open && <span className="text-sm text-muted-foreground">Cerrado</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="online" className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="font-medium">Información de Entrega</h3>
                      <div className="space-y-4">
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

                        <div className="space-y-2">
                          <Label htmlFor="shipping-info">Información de Envío</Label>
                          <Textarea
                            id="shipping-info"
                            placeholder="Ej: Envíos gratis en compras superiores a $50,000"
                            value={newLocation.shippingInfo}
                            onChange={(e) => setNewLocation((prev) => ({ ...prev, shippingInfo: e.target.value }))}
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
                  <Button onClick={handleCreateLocation} disabled={!newLocation.name}>
                    Crear Ubicación
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Plan Limits Progress */}
      {locationLimit !== Infinity && (
        <PlanLimitProgress plan={plan} resourceType="locations" currentCount={locations.length} />
      )}

      {/* Plan Limits Warning */}
      {!canAddLocation && (
        <LockedFeature
          currentPlan={plan}
          featureName="Ubicaciones adicionales"
          requiredPlan={plan === "gratis" ? "basico" : plan === "basico" ? "pro" : "enterprise"}
          description={`Tu plan actual permite hasta ${locationLimit} ubicación${locationLimit > 1 ? "es" : ""}.`}
          variant="inline"
        />
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
                    {location.isPrimary && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />}
                    <h3 className="text-lg font-semibold">{location.name}</h3>
                    {getTypeBadge(location.type)}
                    {location.isPrimary && (
                      <Badge variant="outline" className="text-xs">
                        Principal
                      </Badge>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="mb-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {location.phone && <span>📞 {location.phone}</span>}
                    {location.email && <span>✉️ {location.email}</span>}
                    {location.website && (
                      <a href={location.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        🌐 {location.website}
                      </a>
                    )}
                  </div>

                  {location.type === "physical" && location.address && (
                    <div className="space-y-1 mb-4">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {location.address}
                      </p>
                      {location.businessHours && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatBusinessHours(location.businessHours)}
                        </p>
                      )}
                    </div>
                  )}

                  {location.type === "online" && (
                    <div className="space-y-1 mb-4">
                      {location.deliveryZones && location.deliveryZones.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          📦 Zonas de entrega: {location.deliveryZones.join(", ")}
                        </p>
                      )}
                      {location.shippingInfo && (
                        <p className="text-sm text-muted-foreground">ℹ️ {location.shippingInfo}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled={location.isPrimary}>
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
