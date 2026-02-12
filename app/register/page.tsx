"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { HeroesLogo } from "@/components/heroes-logo"
import { CategoryIcon } from "@/components/category-icon"
import { LocationPickerModal } from "@/components/location-picker-modal"
import { Building2, Mail, Lock, Phone, MapPin, AlertCircle, UserRound, Globe } from "lucide-react"
import { InfoTooltip, analyticsTooltips } from "@/components/ui/info-tooltip"
import Link from "next/link"
import { registerBusiness } from "@/lib/auth"
import { useCategories } from "@/hooks/use-categories"
import { ImageUpload } from "@/components/ui/image-upload"
import { PhoneInput, formatFullPhoneNumber } from "@/components/ui/phone-input"
import { uploadBusinessFeaturedImage, uploadWithRetry } from "@/lib/firebase-storage"
import { BusinessService } from "@/lib/services/business-service"
import { toast } from "sonner"

export default function BusinessRegisterPage() {
  const { categories, isLoading: categoriesLoading } = useCategories()
  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    password: "",
    confirmPassword: "",
    ownerName: "",
    phone: "",
    nit: "",
    category: "",
    description: "",
    website: "",
    plan: "enterprise",
    type: "physical" as "physical" | "online",
    acceptTerms: false,
    // Physical fields only
    address: "",
    coordinates: null as { latitude: number; longitude: number } | null,
    geoHash: null as { geohash: string; geopoint: { latitude: number; longitude: number } } | null,
  })
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null)
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [countryCode, setCountryCode] = useState("+57")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      setIsLoading(false)
      return
    }

    if (!formData.acceptTerms) {
      setError("Debes aceptar los términos y condiciones")
      setIsLoading(false)
      return
    }

    if (!selectedLogoFile) {
      setError("Debes subir el logo de tu empresa")
      setIsLoading(false)
      return
    }

    try {
      const fullPhoneNumber = formatFullPhoneNumber(countryCode, formData.phone)
      // Register the business first
      const businessUser = await registerBusiness(formData.email, formData.password, {
        businessName: formData.businessName,
        nit: formData.nit,
        phone: fullPhoneNumber,
        category: formData.category,
        description: formData.description,
        website: formData.website,
        address: formData.address,
        coordinates: formData.coordinates,
        geoHash: formData.geoHash,
        ownerName: formData.ownerName,
        plan: formData.plan,
        type: formData.type,
      })

      // Upload logo if selected (optional, non-blocking)
      if (selectedLogoFile && businessUser.businessId) {
        try {
          const logoUrl = await uploadWithRetry(
            () => uploadBusinessFeaturedImage(selectedLogoFile, businessUser.businessId),
            2
          )

          if (logoUrl) {
            // Update business with logo URL
            await BusinessService.updateBusiness(businessUser.businessId, {
              featured_image: logoUrl,
            })
            toast.success("Registro exitoso", {
              description: "Tu empresa y logo se han registrado correctamente.",
            })
          } else {
            toast.success("Registro exitoso", {
              description: "Tu empresa se ha registrado. Puedes subir el logo desde Configuración.",
            })
          }
        } catch (logoError) {
          console.error("Error uploading logo:", logoError)
          // Don't block registration if logo upload fails
          toast.success("Registro exitoso", {
            description: "Tu empresa se ha registrado. Puedes subir el logo desde Configuración.",
          })
        }
      }

      // Redirect to verification or dashboard
      router.push("/business/dashboard")
    } catch (err: any) {
      setError(err.message || "Error al registrar la empresa. Intenta nuevamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <HeroesLogo variant="auth" />
          </div>
          <CardTitle className="flex items-center justify-center">
            <Building2 className="h-5 w-5 mr-2 text-primary" />
            Registro Empresarial
          </CardTitle>
          <CardDescription>Únete a la red de empresas aliadas de Héroes Colombia</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-sm font-medium text-muted-foreground">Información de la Empresa</h3>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="businessName">Nombre de la empresa *</Label>
                    <InfoTooltip title={analyticsTooltips.businessName.title}>
                      {analyticsTooltips.businessName.content}
                    </InfoTooltip>
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="businessName"
                      placeholder="Como lo verán los usuarios"
                      value={formData.businessName}
                      className="pl-10"
                      onChange={(e) => handleInputChange("businessName", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="nit">NIT *</Label>
                    <InfoTooltip title={analyticsTooltips.businessNit.title}>
                      {analyticsTooltips.businessNit.content}
                    </InfoTooltip>
                  </div>
                  <Input
                    id="nit"
                    placeholder="900123456-7"
                    value={formData.nit}
                    onChange={(e) => handleInputChange("nit", e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Category and Contact Section */}
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="category">Categoría *</Label>
                    <InfoTooltip title={analyticsTooltips.businessCategory.title}>
                      {analyticsTooltips.businessCategory.content}
                    </InfoTooltip>
                  </div>
                  <Select onValueChange={(value) => handleInputChange("category", value)} disabled={categoriesLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={categoriesLoading ? "Cargando categorías..." : "Selecciona una categoría"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.category_id} value={category.category_id}>
                          <div className="flex items-center gap-2">
                            <CategoryIcon categoryId={category.category_id} size="sm" />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="phone">WhatsApp de contacto *</Label>
                    <InfoTooltip title={analyticsTooltips.businessWhatsapp.title}>
                      {analyticsTooltips.businessWhatsapp.content}
                    </InfoTooltip>
                  </div>
                  <PhoneInput
                    id="phone"
                    value={formData.phone}
                    onChange={(value) => handleInputChange("phone", value)}
                    countryCode={countryCode}
                    onCountryCodeChange={setCountryCode}
                    required
                    size="sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="website">Sitio web (opcional)</Label>
                  <InfoTooltip title={analyticsTooltips.businessWebsite.title}>
                    {analyticsTooltips.businessWebsite.content}
                  </InfoTooltip>
                </div>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.tuempresa.com"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-sm font-medium text-muted-foreground">Ubicación del Negocio</h3>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-4">
                {/* Business Type Selection */}
                <div className="border rounded-lg bg-muted/30 overflow-hidden">
                  <div className="grid grid-cols-2 gap-0 border-t">
                    <button
                      type="button"
                      onClick={() => handleInputChange("type", 'physical')}
                      className={`p-4 text-left transition-colors ${formData.type === 'physical'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted/50'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium text-sm">Ubicación Física</span>
                      </div>
                      <p className={`text-xs ${formData.type === 'physical' ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}>
                        Tengo una tienda o local
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("type", 'online')}
                      className={`p-4 text-left transition-colors border-l ${formData.type === 'online'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-muted/50'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="h-4 w-4" />
                        <span className="font-medium text-sm">Tienda Online</span>
                      </div>
                      <p className={`text-xs ${formData.type === 'online' ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        }`}>
                        Solo vendo por internet
                      </p>
                    </button>
                  </div>
                </div>

                {/* Physical-specific: Location Picker */}
                {formData.type === 'physical' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="address">Dirección de tu negocio *</Label>
                      <InfoTooltip title={analyticsTooltips.businessAddress.title}>
                        {analyticsTooltips.businessAddress.content}
                      </InfoTooltip>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={formData.address}
                        placeholder="Seleccionar ubicación en el mapa"
                        readOnly
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" onClick={() => setIsLocationPickerOpen(true)}>
                        <MapPin className="h-4 w-4 mr-2" />
                        Seleccionar
                      </Button>
                    </div>
                    {formData.coordinates && (
                      <p className="text-xs text-muted-foreground">
                        📍 Lat: {formData.coordinates.latitude.toFixed(6)}, Lng: {formData.coordinates.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Brand Identity Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-sm font-medium text-muted-foreground">Identidad de Marca</h3>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="description">Descripción del negocio</Label>
                    <InfoTooltip title={analyticsTooltips.businessDescription.title}>
                      {analyticsTooltips.businessDescription.content}
                    </InfoTooltip>
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Describe brevemente tu negocio y los productos/servicios que ofreces..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={9}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="logo">Logo de tu empresa *</Label>
                    <InfoTooltip title={analyticsTooltips.businessLogo.title}>
                      {analyticsTooltips.businessLogo.content}
                    </InfoTooltip>
                  </div>
                  <ImageUpload
                    onChange={setSelectedLogoFile}
                    disabled={isLoading}
                    recommendedDimensions="512x512px"
                    className="[&>div]:aspect-square [&>div]:max-h-[200px]"
                  />
                </div>
              </div>
            </div>

            {/* Account Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <h3 className="text-sm font-medium text-muted-foreground">Información para acceder al portal web</h3>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="ownerName">Tu nombre personal *</Label>
                    <InfoTooltip title={analyticsTooltips.ownerName.title}>
                      {analyticsTooltips.ownerName.content}
                    </InfoTooltip>
                  </div>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ownerName"
                      type="text"
                      placeholder="Juan González"
                      value={formData.ownerName}
                      onChange={(e) => handleInputChange("ownerName", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="email">Correo electrónico *</Label>
                    <InfoTooltip title={analyticsTooltips.loginEmail.title}>
                      {analyticsTooltips.loginEmail.content}
                    </InfoTooltip>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nombre@empresa.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repite tu contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => handleInputChange("acceptTerms", checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm">
                Acepto los{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  términos y condiciones
                </Link>{" "}
                y la{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  política de privacidad
                </Link>
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registrando empresa..." : "Registrar Empresa"}
            </Button>
          </form>

          <div className="text-center text-sm mt-6">
            <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
            <Link href="/" className="text-primary hover:underline">
              Inicia sesión aquí
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Location Picker Modal */}
      <LocationPickerModal
        open={isLocationPickerOpen}
        onOpenChange={setIsLocationPickerOpen}
        initialLocation={formData.coordinates}
        onLocationSelect={(result) => {
          setFormData((prev) => ({
            ...prev,
            address: result.formattedAddress,
            coordinates: result.coordinates,
            geoHash: result.geoHash,
          }))
        }}
      />
    </div>
  )
}
