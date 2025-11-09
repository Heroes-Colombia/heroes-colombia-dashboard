"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, MapPin, Globe, Edit, Trash2, MoreHorizontal, Star, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getPlanLimits } from "@/lib/plan-limits"
import { PlanLimitBadge, PlanLimitProgress } from "@/components/plan-limit-badge"
import { UpgradePlanButton } from "@/components/upgrade-plan-button"
import { LockedFeature } from "@/components/locked-feature"
import { LocationService } from "@/lib/services/location-service"
import { LocationPickerModal } from "@/components/location-picker-modal"
import type { BusinessLocation, BusinessHours, PlanType } from "@/lib/types"

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
    // Physical fields only
    address: "",
    coordinates: null as { latitude: number; longitude: number } | null,
    geoHash: null as { geohash: string; geopoint: any } | null,
  })
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)

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

    // Validation
    if (!newLocation.name.trim()) {
      alert("El nombre de la ubicación es requerido")
      return
    }

    if (newLocation.type === "physical" && !newLocation.coordinates) {
      alert("Por favor selecciona una ubicación en el mapa")
      return
    }

    const willBePrimary = locations.length === 0 || newLocation.isPrimary

    const newLocationData = {
      name: newLocation.name.trim(),
      is_primary: willBePrimary,
      type: newLocation.type,
      // Contact fields
      phone: newLocation.phone || null,
      email: newLocation.email || null,
      website: newLocation.website || null,
      // Physical fields only
      address: newLocation.type === "physical" ? newLocation.address : null,
      location: newLocation.type === "physical" && newLocation.coordinates ? newLocation.coordinates : null,
      geo_hash: newLocation.type === "physical" ? newLocation.geoHash : null,
      status: "active",
    }

    try {
      const locationId = await LocationService.createLocation(businessId, newLocationData)

      if (locationId) {
        if (willBePrimary) {
          await LocationService.setPrimaryLocation(businessId, locationId)
        }

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
          coordinates: null,
          geoHash: null,
        })
      }
    } catch (error) {
      console.error("Error creating location:", error)
      alert("Error: No se pudo crear la ubicación")
    }
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
                          Esta será tu ubicación principal.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 1. Name */}
                <div className="space-y-2">
                  <Label htmlFor="location-name">Nombre de la ubicación *</Label>
                  <Input
                    id="location-name"
                    placeholder="Ej: Sede Principal, Tienda Online"
                    value={newLocation.name}
                    onChange={(e) => setNewLocation((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                {/* 2. Type Selector (Tabs) */}
                <div className="space-y-2">
                  <Label>Tipo de ubicación *</Label>
                  <Tabs
                    value={newLocation.type}
                    onValueChange={(value) =>
                      setNewLocation((prev) => ({ ...prev, type: value as "physical" | "online" }))
                    }
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="physical" className="gap-2">
                        <MapPin className="h-4 w-4" />
                        Ubicación Física
                      </TabsTrigger>
                      <TabsTrigger value="online" className="gap-2">
                        <Globe className="h-4 w-4" />
                        Tienda Online
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* 3. Primary toggle (only if not first location) */}
                {locations.length > 0 && (
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <Label className="text-base">Ubicación principal</Label>
                      <p className="text-sm text-muted-foreground">
                        Solo puede haber una ubicación principal
                      </p>
                    </div>
                    <Switch
                      checked={newLocation.isPrimary}
                      onCheckedChange={(checked) => setNewLocation((prev) => ({ ...prev, isPrimary: checked }))}
                    />
                  </div>
                )}

                {/* 4. Contact Info (both types) */}
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

                {/* 5. Physical-specific: Location Picker */}
                {newLocation.type === "physical" && (
                  <div className="space-y-4">
                    <h3 className="font-medium">Ubicación en el Mapa</h3>
                    <div className="space-y-2">
                      <Label>Dirección *</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newLocation.address}
                          placeholder="Selecciona una ubicación en el mapa"
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsLocationPickerOpen(true)}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          Seleccionar
                        </Button>
                      </div>
                      {newLocation.coordinates && (
                        <p className="text-xs text-muted-foreground">
                          📍 Lat: {newLocation.coordinates.latitude.toFixed(6)}, Lng:{" "}
                          {newLocation.coordinates.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. Online-specific: Info message */}
                {newLocation.type === "online" && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-start gap-2">
                      <Globe className="mt-0.5 h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Tienda Online</p>
                        <p className="text-sm text-blue-700">
                          Para tiendas online, solo necesitas la información de contacto. Los clientes se
                          comunicarán contigo directamente.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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

          {/* Location Picker Modal */}
          <LocationPickerModal
            open={isLocationPickerOpen}
            onOpenChange={setIsLocationPickerOpen}
            initialLocation={newLocation.coordinates}
            onLocationSelect={(result) => {
              setNewLocation((prev) => ({
                ...prev,
                address: result.formattedAddress,
                coordinates: result.coordinates,
                geoHash: result.geoHash,
              }))
            }}
          />
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
