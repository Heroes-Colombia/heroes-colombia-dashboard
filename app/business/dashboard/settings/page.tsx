"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Building2, Bell, Shield, Trash2, Plus, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { updateUserPassword, deleteUserAccount } from "@/lib/auth"
import { BusinessService } from "@/lib/services/business-service"
import { useRouter } from "next/navigation"
import { ImageUpload } from "@/components/ui/image-upload"
import { uploadBusinessFeaturedImage, deleteBusinessFeaturedImage, uploadWithRetry } from "@/lib/firebase-storage"
import { toast } from "sonner"

export default function SettingsPage() {
  const { user } = useAuth()
  const businessUser = user as any
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [businessData, setBusinessData] = useState({
    businessId: "",
    name: "",
    identification: "",
    email: "",
    phone_number: "",
    website: "",
    description: "",
    address: "",
    featured_image: "",
  })
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    marketing: false,
  })

  // Load business data when available
  useEffect(() => {
    if (businessUser) {
      setBusinessData({
        businessId: businessUser.businessId || "",
        name: businessUser.businessName || "",
        identification: businessUser.businessIdentification || "",
        email: businessUser.email || "",
        phone_number: businessUser.businessPhone || "",
        website: businessUser.website || "",
        description: businessUser.businessDescription || "",
        address: businessUser.address || "",
        featured_image: businessUser.businessFeaturedImage || "",
      })
    }
  }, [businessUser])

  const handleInputChange = (field: string, value: string) => {
    setBusinessData(prev => ({ ...prev, [field]: value }))
  }

  const handleUpdatePassword = async () => {
    if (!businessUser?.id) return

    // Validation
    if (!newPassword || newPassword.length < 6) {
      alert("La nueva contraseña debe tener al menos 6 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)
    try {
      await updateUserPassword(newPassword)
      alert("Contraseña actualizada exitosamente")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Error updating password:", error)
      alert(error.message || "Error al actualizar la contraseña")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteUserAccount = async () => {
    if (!businessUser?.id) return

    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer y se eliminarán todos tus datos permanentemente."
    )

    if (!confirmed) return

    setIsLoading(true)
    try {
      await deleteUserAccount()
      alert("Cuenta eliminada exitosamente")
      router.push("/auth/login")
    } catch (error: any) {
      console.error("Error deleting account:", error)
      alert(error.message || "Error al eliminar la cuenta")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!businessUser?.id || !businessUser?.businessId) return

    setIsLoading(true)
    let imageUploadFailed = false

    try {
      let featuredImageUrl = businessData.featured_image || ""

      // Handle image upload if a new file was selected
      if (selectedImageFile) {
        // Upload new image with retry FIRST
        const uploadedUrl = await uploadWithRetry(
          () => uploadBusinessFeaturedImage(selectedImageFile, businessUser.businessId),
          2
        )

        if (uploadedUrl) {
          // Only after successful upload, delete the old image
          const oldImageUrl = businessData.featured_image
          if (oldImageUrl) {
            try {
              await deleteBusinessFeaturedImage(oldImageUrl, businessUser.businessId)
            } catch (error) {
              console.error("Error deleting old image:", error)
              // Continue anyway - not critical, new image is already uploaded
            }
          }
          featuredImageUrl = uploadedUrl
        } else {
          // Upload failed - keep the old image URL intact
          imageUploadFailed = true
          console.error("Image upload failed after retries")
        }
      }

      // Update business data with new image URL
      const updatedData = {
        ...businessData,
        featured_image: featuredImageUrl,
      }

      const success = await BusinessService.updateBusiness(businessUser.businessId, updatedData)

      if (success) {
        // Update local state
        setBusinessData((prev) => ({ ...prev, featured_image: featuredImageUrl }))
        setSelectedImageFile(null)

        if (imageUploadFailed) {
          toast.success("Cambios guardados", {
            description: "Nota: La imagen no se pudo subir. Puedes intentar subirla nuevamente.",
          })
        } else {
          toast.success("Cambios guardados exitosamente")
        }
      } else {
        toast.error("Error al guardar los cambios")
      }
    } catch (error) {
      console.error("Error saving business settings:", error)
      toast.error("Error al guardar los cambios")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando configuración...</span>
      </div>
    )
  }

  if (!businessUser) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontró información del negocio</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Gestiona la información de tu empresa y configuraciones de la cuenta</p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList>
          <TabsTrigger value="business">Empresa</TabsTrigger>
          {/* <TabsTrigger value="notifications">Notificaciones</TabsTrigger> */}
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Información de la Empresa
              </CardTitle>
              <CardDescription>Actualiza los datos básicos de tu empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Nombre de la Empresa</Label>
                  <Input
                    id="business-name"
                    value={businessData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-nit">NIT</Label>
                  <Input
                    id="business-nit"
                    value={businessData.identification}
                    onChange={(e) => handleInputChange("identification", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-email">Email</Label>
                  <Input
                    id="business-email"
                    type="email"
                    value={businessData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-phone">Teléfono</Label>
                  <Input
                    id="business-phone"
                    value={businessData.phone_number}
                    onChange={(e) => handleInputChange("phone_number", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-website">Sitio Web</Label>
                  <Input
                    id="business-website"
                    value={businessData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://ejemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-address">Dirección</Label>
                  <Input
                    id="business-address"
                    value={businessData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-description">Descripción</Label>
                <Textarea
                  id="business-description"
                  value={businessData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={3}
                  placeholder="Describe tu negocio..."
                />
              </div>
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo de la Empresa *</Label>
                <div className="max-w-sm">
                  <ImageUpload
                    value={businessData.featured_image}
                    onChange={setSelectedImageFile}
                    disabled={isLoading}
                    recommendedDimensions="512x512px (cuadrado)"
                    className="[&>div]:aspect-square [&>div]:max-h-64"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  El logo será visible en la app móvil para que los usuarios reconozcan tu negocio fácilmente
                </p>
              </div>
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Plan actual:</span>
                  <Badge>{businessUser.plan || "gratis"}</Badge>
                </div>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificaciones
              </CardTitle>
              <CardDescription>Configura cómo quieres recibir notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe actualizaciones importantes por correo electrónico
                    </p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones en tiempo real en tu navegador
                    </p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, push: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones SMS</Label>
                    <p className="text-sm text-muted-foreground">Recibe alertas importantes por mensaje de texto</p>
                  </div>
                  <Switch
                    checked={notifications.sms}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, sms: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing y Promociones</Label>
                    <p className="text-sm text-muted-foreground">Recibe información sobre nuevas funciones y ofertas</p>
                  </div>
                  <Switch
                    checked={notifications.marketing}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, marketing: checked }))}
                  />
                </div>
              </div>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Guardando..." : "Guardar Preferencias"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Seguridad
              </CardTitle>
              <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button onClick={handleUpdatePassword} disabled={isLoading}>
                  {isLoading ? "Actualizando..." : "Cambiar Contraseña"}
                </Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-destructive mb-4">Zona de Peligro</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-destructive/20 rounded-lg">
                    <h4 className="font-medium mb-2">Eliminar Cuenta</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos.
                    </p>
                    <Button variant="destructive" onClick={handleDeleteUserAccount} disabled={isLoading}>
                      {isLoading ? "Eliminando..." : "Eliminar Cuenta"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
