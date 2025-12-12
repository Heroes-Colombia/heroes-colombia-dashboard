"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Loader2, Search, X } from "lucide-react"
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

const libraries: readonly ("geocoding" | "places")[] = ["geocoding", "places"] as const

const mapContainerStyle = {
  width: "100%",
  height: "400px",
} as const

const defaultCenter = {
  lat: 4.711, // Bogotá
  lng: -74.0721,
} as const

// Geohash precision: 9 characters = ~4.77m x 4.77m precision (suitable for business locations)
const GEOHASH_PRECISION = 9

export function LocationPickerModal({
  open,
  onOpenChange,
  initialLocation,
  onLocationSelect,
}: LocationPickerModalProps) {
  // IMPORTANT: This API key is intentionally public (NEXT_PUBLIC_ prefix)
  // and MUST be restricted in Google Cloud Console to:
  // 1. Allowed domains: app.heroescolombia.com, localhost
  // 2. API restrictions: Maps JavaScript API, Geocoding API only
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY_WEB

  // Validate API key exists
  if (!apiKey) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Error de Configuración</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-red-600">
            Error: Google Maps API key no está configurada. Por favor contacta al administrador.
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: libraries as any,
  })

  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(
    initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
  )
  const [selectedAddress, setSelectedAddress] = useState<string>("")
  const [isGettingAddress, setIsGettingAddress] = useState(false)

  // Search state
  const [searchValue, setSearchValue] = useState<string>("")
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const mapRef = useRef<google.maps.Map | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Memoize map center
  const mapCenter = useMemo(
    () => selectedLocation || defaultCenter,
    [selectedLocation]
  )

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (searchDebounceTimerRef.current) {
        clearTimeout(searchDebounceTimerRef.current)
      }
    }
  }, [])

  // Reverse geocode coordinates to address (cached geocoder to prevent memory leak)
  const getAddressFromCoordinates = useCallback(async (location: LatLng) => {
    // Safety check: ensure Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps) {
      console.warn("Google Maps not loaded yet, skipping geocoding")
      return
    }

    setIsGettingAddress(true)
    try {
      // Lazy initialize geocoder (reuse instance to prevent memory leak)
      if (!geocoderRef.current) {
        geocoderRef.current = new google.maps.Geocoder()
      }

      const response = await geocoderRef.current.geocode({ location })

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

  // Debounced version for drag events (reduces API calls)
  const debouncedGetAddress = useCallback((location: LatLng) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      getAddressFromCoordinates(location)
    }, 500)
  }, [getAddressFromCoordinates])

  // Search for places using autocomplete
  const searchPlaces = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    // Safety check: ensure Google Maps is loaded
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      console.warn("Google Maps Places API not loaded yet")
      return
    }

    setIsSearching(true)

    try {
      // Lazy initialize autocomplete service
      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
      }

      const request: google.maps.places.AutocompletionRequest = {
        input: query,
        componentRestrictions: { country: 'co' }, // Bias to Colombia
        types: ['establishment', 'geocode'], // Include businesses and addresses
      }

      autocompleteServiceRef.current.getPlacePredictions(request, (predictions, status) => {
        setIsSearching(false)

        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setSuggestions(predictions)
          setShowSuggestions(true)
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setSuggestions([])
          setShowSuggestions(true)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      })
    } catch (error) {
      console.error("Autocomplete error:", error)
      setIsSearching(false)
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [])

  // Debounced search to reduce API calls
  const debouncedSearch = useCallback((query: string) => {
    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current)
    }
    searchDebounceTimerRef.current = setTimeout(() => {
      searchPlaces(query)
    }, 300)
  }, [searchPlaces])

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    debouncedSearch(value)
  }, [debouncedSearch])

  // Handle place selection from suggestions
  const handlePlaceSelect = useCallback(async (placeId: string) => {
    try {
      // Initialize places service if needed (requires map instance)
      if (!placesServiceRef.current && mapRef.current) {
        placesServiceRef.current = new google.maps.places.PlacesService(mapRef.current)
      }

      if (!placesServiceRef.current) {
        console.error("Places service not initialized")
        return
      }

      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['geometry', 'formatted_address'],
      }

      placesServiceRef.current.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }

          setSelectedLocation(location)
          setSelectedAddress(place.formatted_address || "")
          setShowSuggestions(false)
          setSearchValue("")
          setSuggestions([])

          // Pan map to selected location
          if (mapRef.current) {
            mapRef.current.panTo(location)
            mapRef.current.setZoom(16)
          }
        }
      })
    } catch (error) {
      console.error("Place details error:", error)
    }
  }, [])

  // Get user's current location when modal opens
  useEffect(() => {
    if (!open || initialLocation) return

    let isMounted = true

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return // Component unmounted, skip update

          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
          setSelectedLocation(userLocation)
          getAddressFromCoordinates(userLocation)
        },
        (error) => {
          console.log("Geolocation error, using default (Bogotá):", error)
          // Silently fall back to Bogotá
        }
      )
    }

    return () => {
      isMounted = false
    }
  }, [open, initialLocation, getAddressFromCoordinates])

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedLocation(
        initialLocation ? { lat: initialLocation.latitude, lng: initialLocation.longitude } : null
      )
      setSelectedAddress("")
      setIsGettingAddress(false)
      setSearchValue("")
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [open, initialLocation])

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

  // Handle marker drag (uses debounced geocoding to reduce API calls)
  const handleMarkerDrag = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const location = { lat: e.latLng.lat(), lng: e.latLng.lng() }
        setSelectedLocation(location)
        debouncedGetAddress(location) // Debounced to prevent excessive API calls
      }
    },
    [debouncedGetAddress]
  )

  // Validate coordinates are within valid Earth bounds
  const isValidCoordinates = useCallback((lat: number, lng: number): boolean => {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  }, [])

  // Generate geohash
  const generateGeoHash = useCallback((lat: number, lng: number) => {
    return {
      geohash: geohash.encode(lat, lng, GEOHASH_PRECISION),
      geopoint: { latitude: lat, longitude: lng },
    }
  }, [])

  // Confirm selection
  const handleConfirm = useCallback(() => {
    if (!selectedLocation || !selectedAddress || isGettingAddress) {
      alert("Por favor selecciona una ubicación en el mapa")
      return
    }

    // Validate coordinates are within valid ranges
    if (!isValidCoordinates(selectedLocation.lat, selectedLocation.lng)) {
      alert("Las coordenadas seleccionadas no son válidas")
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
    onOpenChange(false)
  }, [selectedLocation, selectedAddress, isGettingAddress, isValidCoordinates, generateGeoHash, onLocationSelect, onOpenChange])

  // Map loaded handler
  const handleMapLoad = useCallback((mapInstance: google.maps.Map) => {
    mapRef.current = mapInstance
  }, [])

  // Loading state
  if (loadError) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Error al cargar el mapa</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-red-600">
            Error al cargar Google Maps. Por favor, verifica tu conexión e intenta de nuevo.
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!isLoaded) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Seleccionar Ubicación en el Mapa</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando mapa...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seleccionar Ubicación en el Mapa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pb-2">
          {/* Search Bar */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar dirección o lugar en Colombia..."
                value={searchValue}
                onChange={handleSearchChange}
                className="pl-10 pr-10"
              />
              {searchValue && (
                <button
                  onClick={() => {
                    setSearchValue("")
                    setSuggestions([])
                    setShowSuggestions(false)
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute z-50 w-full mt-2 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
                  </div>
                ) : suggestions.length > 0 ? (
                  <ul className="py-2">
                    {suggestions.map((suggestion) => (
                      <li key={suggestion.place_id}>
                        <button
                          onClick={() => handlePlaceSelect(suggestion.place_id)}
                          className="w-full text-left px-4 py-2 hover:bg-muted transition-colors flex items-start gap-2"
                        >
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {suggestion.structured_formatting.main_text}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {suggestion.structured_formatting.secondary_text}
                            </div>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No se encontraron resultados
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="rounded-lg overflow-hidden border">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={selectedLocation ? 16 : 12}
              onClick={handleMapClick}
              onLoad={handleMapLoad}
              options={{
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              {selectedLocation && (
                <Marker position={selectedLocation} draggable onDragEnd={handleMarkerDrag} />
              )}
            </GoogleMap>
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
            <Button
              onClick={handleConfirm}
              disabled={!selectedLocation || !selectedAddress || isGettingAddress}
            >
              {isGettingAddress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Obteniendo dirección...
                </>
              ) : (
                "Confirmar Ubicación"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
