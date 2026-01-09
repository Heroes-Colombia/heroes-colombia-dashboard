"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, MapPin, Globe, Edit, Trash2, AlertCircle, Loader2, Crown } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getPlanLimits } from "@/lib/plan-limits"
import { PlanLimitBadge, PlanLimitProgress } from "@/components/plan-limit-badge"
import { PhoneInput } from "@/components/ui/phone-input"
import { LockedFeature } from "@/components/locked-feature"
import { LocationService } from "@/lib/services/location-service"
import { PromotionService } from "@/lib/services/promotion-service"
import { LocationPickerModal } from "@/components/location-picker-modal"
import type { PlanType } from "@/lib/types"

type DialogMode = "create" | "edit"

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>("create")
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null)
  const [locationFormData, setLocationFormData] = useState({
    name: "",
    type: "physical" as "physical" | "online",
    isPrimary: false,
    // Contact fields (all locations)
    phone: "",
    email: "",
    // Physical fields only
    address: "",
    coordinates: null as { latitude: number; longitude: number } | null,
    geoHash: null as { geohash: string; geopoint: any } | null,
  })
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingLocation, setDeletingLocation] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [countryCode, setCountryCode] = useState("+57")

  const { user } = useAuth()
  const businessUser = user as any
  const plan: PlanType = businessUser?.plan || "basico"
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

  // Reset form to initial state
  const resetForm = () => {
    setLocationFormData({
      name: "",
      type: "physical",
      isPrimary: false,
      phone: "",
      email: "",
      address: "",
      coordinates: null,
      geoHash: null,
    })
  }

  // Open create dialog
  const handleOpenCreateDialog = () => {
    resetForm()
    setDialogMode("create")
    setEditingLocationId(null)
    setIsDialogOpen(true)
  }

  // Open edit dialog
  const handleOpenEditDialog = (location: any) => {
    setLocationFormData({
      name: location.name,
      type: location.type,
      isPrimary: location.isPrimary || location.is_primary || false,
      phone: location.phone || "",
      email: location.email || "",
      address: location.address || "",
      coordinates: location.location
        ? { latitude: location.location.latitude, longitude: location.location.longitude }
        : null,
      geoHash: location.geo_hash || null,
    })
    setDialogMode("edit")
    setEditingLocationId(location.id)
    setIsDialogOpen(true)
  }

  // Handle create/edit location
  const handleSaveLocation = async () => {
    if (!businessId) return

    // Validation
    if (!locationFormData.name.trim()) {
      alert("El nombre de la ubicación es requerido")
      return
    }

    if (locationFormData.type === "physical" && !locationFormData.coordinates) {
      alert("Por favor selecciona una ubicación en el mapa")
      return
    }

    const willBePrimary = locations.length === 0 || locationFormData.isPrimary

    const locationData = {
      name: locationFormData.name.trim(),
      is_primary: willBePrimary,
      type: locationFormData.type,
      // Contact fields
      phone: locationFormData.phone || null,
      email: locationFormData.email || null,
      // Physical fields only
      address: locationFormData.type === "physical" ? locationFormData.address : null,
      location: locationFormData.type === "physical" && locationFormData.coordinates ? locationFormData.coordinates : null,
      geo_hash: locationFormData.type === "physical" ? locationFormData.geoHash : null,
      status: "active",
    }

    try {
      if (dialogMode === "create") {
        // Create new location
        const locationId = await LocationService.createLocation(businessId, locationData)

        if (locationId) {
          if (willBePrimary) {
            await LocationService.setPrimaryLocation(businessId, locationId)
          }

          const fetchedLocations = await LocationService.getBusinessLocations(businessId)
          setLocations(fetchedLocations)

          alert("Ubicación creada exitosamente")
          setIsDialogOpen(false)
          resetForm()
        }
      } else {
        // Update existing location
        if (!editingLocationId) return

        const success = await LocationService.updateLocation(businessId, editingLocationId, locationData)

        if (success) {
          if (willBePrimary) {
            await LocationService.setPrimaryLocation(businessId, editingLocationId)
          }

          const fetchedLocations = await LocationService.getBusinessLocations(businessId)
          setLocations(fetchedLocations)

          alert("Ubicación actualizada exitosamente")
          setIsDialogOpen(false)
          resetForm()
        }
      }
    } catch (error) {
      console.error("Error saving location:", error)
      alert("Error: No se pudo guardar la ubicación")
    }
  }

  // Open delete confirmation dialog
  const handleOpenDeleteDialog = (location: any) => {
    setDeletingLocation(location)
    setIsDeleteDialogOpen(true)
  }

  // Handle delete location
  const handleDeleteLocation = async () => {
    if (!businessId || !deletingLocation) return

    setIsDeleting(true)

    try {
      // Check if this is the last location
      if (locations.length === 1) {
        alert("No puedes eliminar la última ubicación. Tu negocio debe tener al menos una ubicación.")
        setIsDeleting(false)
        return
      }

      // Check if location is used in promotions
      const allPromotions = await PromotionService.getPromotions({ businessId })
      const promotionsUsingLocation = allPromotions.filter((promo) => {
        // If promotion has no location_ids array or is empty, it targets all locations
        if (!promo.location_ids || promo.location_ids.length === 0) {
          return true
        }
        // Check if this location is specifically targeted
        return promo.location_ids.includes(deletingLocation.id)
      })

      if (promotionsUsingLocation.length > 0) {
        const activePromotions = promotionsUsingLocation.filter((p) => p.status === "active")
        if (activePromotions.length > 0) {
          alert(
            `No puedes eliminar esta ubicación porque tiene ${activePromotions.length} promoción(es) activa(s). ` +
            `Por favor, desactiva o edita las promociones primero.`
          )
          setIsDeleting(false)
          return
        }
      }

      // Delete the location
      const success = await LocationService.deleteLocation(businessId, deletingLocation.id)

      if (success) {
        const fetchedLocations = await LocationService.getBusinessLocations(businessId)
        setLocations(fetchedLocations)

        alert("Ubicación eliminada exitosamente")
        setIsDeleteDialogOpen(false)
        setDeletingLocation(null)
      } else {
        alert("Error: No se pudo eliminar la ubicación")
      }
    } catch (error) {
      console.error("Error deleting location:", error)
      alert("Error: No se pudo eliminar la ubicación")
    } finally {
      setIsDeleting(false)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ubicaciones</h1>
          <p className="text-muted-foreground">Gestiona tus ubicaciones físicas y online</p>
        </div>
        <div className="flex items-center gap-4">
          <PlanLimitBadge plan={plan} resourceType="locations" currentCount={locations.length} showIcon />
          <Button onClick={handleOpenCreateDialog} disabled={!canAddLocation}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva Ubicación
          </Button>
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
          requiredPlan={plan === "basico" ? "pro" : "enterprise"}
          description={`Tu plan actual permite hasta ${locationLimit} ubicación${locationLimit > 1 ? "es" : ""}.`}
          variant="inline"
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
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
          <SelectTrigger className="w-full sm:w-40">
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
          <Card key={location.id} className={location.isPrimary || location.is_primary ? "border-primary/50 bg-primary/5" : ""}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {(location.isPrimary || location.is_primary) && (
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-yellow-400/20 border border-yellow-400/50">
                        <Crown className="h-4 w-4 fill-yellow-600 text-yellow-600" />
                        <span className="text-xs font-semibold text-yellow-700">SEDE PRINCIPAL</span>
                      </div>
                    )}
                    <h3 className="text-lg font-semibold">{location.name}</h3>
                    {getTypeBadge(location.type)}
                  </div>

                  {/* Contact Info */}
                  <div className="mb-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                    {location.phone && <span>📞 {location.phone}</span>}
                    {location.email && <span>✉️ {location.email}</span>}
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
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEditDialog(location)}
                    title="Editar ubicación"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={location.isPrimary || location.is_primary}
                    onClick={() => handleOpenDeleteDialog(location)}
                    title={
                      location.isPrimary || location.is_primary
                        ? "No puedes eliminar la ubicación principal. Marca otra ubicación como principal primero."
                        : "Eliminar ubicación"
                    }
                    className={location.isPrimary || location.is_primary ? "cursor-not-allowed" : ""}
                  >
                    <Trash2 className="h-4 w-4" />
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
                <Button onClick={handleOpenCreateDialog}>
                  <Plus className="h-4 w-4 mr-1" />
                  Crear Primera Ubicación
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Location Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "Crear Nueva Ubicación" : "Editar Ubicación"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Primary Location Notice */}
            {locations.length === 0 && dialogMode === "create" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Primera ubicación</p>
                    <p className="text-sm text-blue-700">Esta será tu ubicación principal.</p>
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
                value={locationFormData.name}
                onChange={(e) => setLocationFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>

            {/* 2. Type Selector (Tabs) */}
            <div className="space-y-2">
              <Label>Tipo de ubicación *</Label>
              <Tabs
                value={locationFormData.type}
                onValueChange={(value) =>
                  setLocationFormData((prev) => ({ ...prev, type: value as "physical" | "online" }))
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

            {/* 3. Physical-specific: Location Picker */}
            {locationFormData.type === "physical" && (
              <div className="space-y-2">
                <Label>Dirección *</Label>
                <div className="flex gap-2">
                  <Input
                    value={locationFormData.address}
                    placeholder="Selecciona una ubicación en el mapa"
                    readOnly
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => setIsLocationPickerOpen(true)}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Seleccionar
                  </Button>
                </div>
                {locationFormData.coordinates && (
                  <p className="text-xs text-muted-foreground">
                    📍 Lat: {locationFormData.coordinates.latitude.toFixed(6)}, Lng:{" "}
                    {locationFormData.coordinates.longitude.toFixed(6)}
                  </p>
                )}
              </div>
            )}

            {/* 4. Primary toggle (only if not first location) */}
            {locations.length > 0 && (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Ubicación principal</Label>
                  <p className="text-sm text-muted-foreground">Solo puede haber una ubicación principal</p>
                </div>
                <Switch
                  checked={locationFormData.isPrimary}
                  onCheckedChange={(checked) => setLocationFormData((prev) => ({ ...prev, isPrimary: checked }))}
                />
              </div>
            )}

            {/* 5. Contact Info (both types) */}
            <div className="space-y-4">
              <h3 className="font-medium">Información de Contacto</h3>
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp</Label>
                  <PhoneInput
                    id="phone"
                    value={locationFormData.phone}
                    onChange={(value) => setLocationFormData((prev) => ({ ...prev, phone: value }))}
                    countryCode={countryCode}
                    onCountryCodeChange={setCountryCode}
                    required
                    size="sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@mitienda.com"
                    value={locationFormData.email}
                    onChange={(e) => setLocationFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* 6. Online-specific: Info message */}
            {locationFormData.type === "online" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-2">
                  <Globe className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Tienda Online</p>
                    <p className="text-sm text-blue-700">
                      Para tiendas online, solo necesitas la información de contacto. Los clientes se comunicarán
                      contigo directamente.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveLocation} disabled={!locationFormData.name}>
                {dialogMode === "create" ? "Crear Ubicación" : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Location Picker Modal */}
      <LocationPickerModal
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        initialLocation={locationFormData.coordinates}
        onLocationSelect={(result) => {
          setLocationFormData((prev) => ({
            ...prev,
            address: result.formattedAddress,
            coordinates: result.coordinates,
            geoHash: result.geoHash,
          }))
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              ¿Estás seguro de que deseas eliminar la ubicación{" "}
              <span className="font-semibold text-foreground">"{deletingLocation?.name}"</span>?
            </p>
            <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteLocation} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
