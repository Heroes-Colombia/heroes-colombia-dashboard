# Location Picker Implementation Plan

**Created:** 2025-01-09
**Status:** Planning → Ready for Implementation
**Objective:** Implement Google Maps location picker with simplified location schema

---

## Context & Requirements

### Problem Statement
1. **Hardcoded coordinates** in location creation (lines 124-128)
2. **Confusing UX** - Dropdown + Tabs for type selection
3. **Information overload** - Too many fields in modal
4. **Unnecessary complexity** - Business hours, delivery zones, shipping info

### Solution
- Interactive Google Maps location picker (like Flutter app)
- Simplified schema: **Physical = address + map**, **Online = contact only**
- Clean UX: Tabs-only type selection, minimal fields

---

## Simplified Data Model

### ❌ OLD Schema (Remove These Fields)
```typescript
{
  business_hours: BusinessHours[]    // ❌ Remove
  delivery_zones: string[]           // ❌ Remove
  shipping_info: string              // ❌ Remove
  city: string                       // ❌ Remove (get from address)
  zipCode: string                    // ❌ Remove
}
```

### ✅ NEW Simplified Schema
```typescript
interface BusinessLocation {
  // Common fields (both types)
  name: string
  type: "physical" | "online"
  is_primary: boolean
  phone?: string
  email?: string
  website?: string
  status: "active" | "inactive"

  // Physical-only fields
  address?: string                    // From map picker
  location?: {                        // From map picker
    latitude: number
    longitude: number
  }
  geo_hash?: {                        // Auto-generated
    geohash: string
    geopoint: { latitude: number; longitude: number }
  }

  // Timestamps
  created_at: Timestamp
  updated_at: Timestamp
}
```

**Key Changes:**
- ✅ **Physical locations**: Just name, contact, address (via map), geolocation
- ✅ **Online locations**: Just name, contact info (phone, email, website)
- ❌ **Removed**: Business hours, delivery zones, shipping, city, zipCode

---

## UX Improvements

### 1. Simplified Modal Structure

**Before** (overcomplicated):
```
┌─────────────────────────────────────┐
│ Name: [_________]                   │
│ Type: [▼ Physical/Online] ← Dropdown│
│ Is Primary: [Toggle]                │
│                                     │
│ Contact: Phone, Email, Website      │
│                                     │
│ [Tabs: Physical | Online]           │
│   Physical:                         │
│     - Address fields                │
│     - City dropdown                 │
│     - Zip code                      │
│     - 7-day business hours editor   │
│   Online:                           │
│     - Delivery zones                │
│     - Shipping info                 │
└─────────────────────────────────────┘
```

**After** (clean):
```
┌─────────────────────────────────────┐
│ Name: [_________]                   │
│                                     │
│ [🏪 Physical Store | 🌐 Online] ← Tabs only │
│                                     │
│ Contact Info:                       │
│   Phone: [_________]                │
│   Email: [_________]                │
│   Website: [_________]              │
│                                     │
│ IF Physical:                        │
│   Address: [____________] [📍 Map]  │
│   Lat/Lng: (from map picker)        │
│                                     │
│ IF Online:                          │
│   ℹ️ Solo necesitas la info de      │
│      contacto para tienda online    │
└─────────────────────────────────────┘
```

### 2. Type Selection Fix
- Remove dropdown (lines 302-318)
- Tabs control the type directly
- Visual icons (🏪 MapPin, 🌐 Globe)

---

## Implementation Plan

### **Phase 1: Dependencies & Setup**

#### Installation Commands (User will run these)
```bash
npm install @react-google-maps/api ngeohash
npm install --save-dev @types/ngeohash
```

#### Verify Environment
- `.env.local` has `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_WEB`
- Google Cloud APIs enabled:
  - Maps JavaScript API
  - Places API
  - Geocoding API

---

### **Phase 2: Refactor Location Page**

#### Task 2.1: Update State Schema
**File:** `app/business/dashboard/locations/page.tsx`

**Replace lines 32-53** with:
```typescript
const [newLocation, setNewLocation] = useState({
  name: "",
  type: "physical" as "physical" | "online",
  isPrimary: false,

  // Contact fields (both types)
  phone: "",
  email: "",
  website: "",

  // Physical-only fields
  address: "",
  coordinates: null as { latitude: number; longitude: number } | null,
  geoHash: null as { geohash: string; geopoint: any } | null,
})

const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
```

#### Task 2.2: Simplify Modal UI
**Replace lines 291-499** with new clean structure:

```tsx
<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle>Crear Nueva Ubicación</DialogTitle>
  </DialogHeader>

  <div className="space-y-6">
    {/* First location notice */}
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
          onCheckedChange={(checked) =>
            setNewLocation((prev) => ({ ...prev, isPrimary: checked }))
          }
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

    {/* Actions */}
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
```

#### Task 2.3: Update Create Handler
**Update `handleCreateLocation` function (lines 105-178)**:

```typescript
const handleCreateLocation = async () => {
  if (!businessId) return

  const willBePrimary = locations.length === 0 || newLocation.isPrimary

  // Validation
  if (!newLocation.name.trim()) {
    alert("El nombre de la ubicación es requerido")
    return
  }

  if (newLocation.type === "physical" && !newLocation.coordinates) {
    alert("Por favor selecciona una ubicación en el mapa")
    return
  }

  const newLocationData = {
    name: newLocation.name.trim(),
    is_primary: willBePrimary,
    type: newLocation.type,

    // Contact fields
    phone: newLocation.phone || null,
    email: newLocation.email || null,
    website: newLocation.website || null,

    // Physical-only fields
    address: newLocation.type === "physical" ? newLocation.address : null,
    location:
      newLocation.type === "physical" && newLocation.coordinates
        ? newLocation.coordinates
        : null,
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
```

#### Task 2.4: Remove Unused Functions
**Delete these functions** (no longer needed):
- `updateBusinessHours` (line 180)
- `formatBusinessHours` (line 189)
- `formatDayRange` (line 230)

---

### **Phase 3: Location Picker Component**

#### Task 3.1: Create Component File
**File:** `components/location-picker-modal.tsx`

```tsx
"use client"

import { useState, useCallback } from "react"
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2 } from "lucide-react"
import geohash from "ngeohash"

interface LocationPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialLocation?: { latitude: number; longitude: number } | null
  onLocationSelect: (result: LocationResult) => void
}

interface LocationResult {
  coordinates: { latitude: number; longitude: number }
  formattedAddress: string
  geoHash: {
    geohash: string
    geopoint: { latitude: number; longitude: number }
  }
}

interface LatLng {
  lat: number
  lng: number
}

const libraries: ("places" | "geocoding")[] = ["places", "geocoding"]

const mapContainerStyle = {
  width: "100%",
  height: "500px",
}

const defaultCenter = {
  lat: 4.711, // Bogotá
  lng: -74.0721,
}

export function LocationPickerModal({
  open,
  onOpenChange,
  initialLocation,
  onLocationSelect,
}: LocationPickerModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  )
  const [selectedAddress, setSelectedAddress] = useState<string>("")
  const [isGettingAddress, setIsGettingAddress] = useState(false)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  // Reverse geocode coordinates to address
  const getAddressFromCoordinates = useCallback(async (location: LatLng) => {
    setIsGettingAddress(true)
    try {
      const geocoder = new google.maps.Geocoder()
      const response = await geocoder.geocode({ location })

      if (response.results[0]) {
        setSelectedAddress(response.results[0].formatted_address)
      } else {
        setSelectedAddress("Dirección no disponible")
      }
    } catch (error) {
      console.error("Geocoding error:", error)
      setSelectedAddress("Error al obtener dirección")
    } finally {
      setIsGettingAddress(false)
    }
  }, [])

  // Handle map click
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const location = { lat: e.latLng.lat(), lng: e.latLng.lng() }
        setSelectedLocation(location)
        getAddressFromCoordinates(location)
      }
    },
    [getAddressFromCoordinates]
  )

  // Handle marker drag
  const handleMarkerDrag = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const location = { lat: e.latLng.lat(), lng: e.latLng.lng() }
        setSelectedLocation(location)
        getAddressFromCoordinates(location)
      }
    },
    [getAddressFromCoordinates]
  )

  // Autocomplete loaded
  const onAutocompleteLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance)
  }, [])

  // Place selected from autocomplete
  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        }
        setSelectedLocation(location)
        setSelectedAddress(place.formatted_address || "")

        // Pan map to selected location
        if (map) {
          map.panTo(location)
          map.setZoom(15)
        }
      }
    }
  }, [autocomplete, map])

  // Generate geohash
  const generateGeoHash = (lat: number, lng: number) => {
    return {
      geohash: geohash.encode(lat, lng, 9),
      geopoint: { latitude: lat, longitude: lng },
    }
  }

  // Confirm selection
  const handleConfirm = () => {
    if (!selectedLocation || !selectedAddress) {
      alert("Por favor selecciona una ubicación en el mapa")
      return
    }

    const result: LocationResult = {
      coordinates: {
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      },
      formattedAddress: selectedAddress,
      geoHash: generateGeoHash(selectedLocation.lat, selectedLocation.lng),
    }

    onLocationSelect(result)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Seleccionar Ubicación en el Mapa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search bar */}
          <div className="space-y-2">
            <Label>Buscar dirección</Label>
            <LoadScript
              googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_WEB!}
              libraries={libraries}
            >
              <Autocomplete
                onLoad={onAutocompleteLoad}
                onPlaceChanged={onPlaceChanged}
                restrictions={{ country: "co" }}
              >
                <Input type="text" placeholder="Buscar dirección en Colombia..." className="w-full" />
              </Autocomplete>
            </LoadScript>
          </div>

          {/* Map */}
          <div className="rounded-lg overflow-hidden border">
            <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_WEB!}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={selectedLocation || defaultCenter}
                zoom={15}
                onClick={handleMapClick}
                onLoad={setMap}
              >
                {selectedLocation && (
                  <Marker position={selectedLocation} draggable onDragEnd={handleMarkerDrag} />
                )}
              </GoogleMap>
            </LoadScript>
          </div>

          {/* Selected location info */}
          <div className="rounded-lg border bg-muted p-4 space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">Ubicación Seleccionada</span>
            </div>
            {isGettingAddress ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Obteniendo dirección...
              </div>
            ) : selectedAddress ? (
              <p className="text-sm">{selectedAddress}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Haz clic en el mapa para seleccionar</p>
            )}
            {selectedLocation && (
              <p className="text-xs text-muted-foreground">
                Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={!selectedLocation || !selectedAddress}>
              Confirmar Ubicación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

---

### **Phase 4: Testing**

#### Checklist
- [ ] Install dependencies: `npm install @react-google-maps/api ngeohash @types/ngeohash`
- [ ] Type selection works (tabs only)
- [ ] Modal shows simplified UI
- [ ] Physical location: Map picker opens
- [ ] Search address works (Places Autocomplete)
- [ ] Click/drag map updates coordinates
- [ ] Reverse geocoding shows address
- [ ] Geohash generated (9 chars)
- [ ] Online location: No map, just contact
- [ ] Firebase saves correct schema
- [ ] Mobile responsive

---

## Success Criteria

✅ **UX Improvements**
- Tabs-only type selection (no dropdown)
- Minimal fields (removed hours, zones, shipping)
- Clear distinction between physical/online

✅ **Location Picker**
- Interactive Google Maps
- Places Autocomplete search
- Reverse geocoding
- Geohash generation

✅ **Data Model**
- Physical: name, contact, address, location, geo_hash
- Online: name, contact only
- Firebase saves correctly

---

**Status:** ✅ Ready for Implementation
**Next:** Run `npm install` commands, then start Phase 2

