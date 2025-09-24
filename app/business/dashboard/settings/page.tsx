"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, MapPin, Phone, Users, Bell, Shield, Trash2, Plus } from "lucide-react"

const mockBusiness = {
  name: "Restaurante El Dorado",
  email: "contacto@eldorado.com",
  phone: "+57 301 234 5678",
  website: "https://eldorado.com",
  description: "Restaurante tradicional colombiano con más de 20 años de experiencia.",
  category: "Restaurante",
  nit: "900123456-7",
  plan: "Básico",
  locations: [
    {
      id: 1,
      name: "Sede Principal",
      address: "Carrera 15 #85-32, Bogotá",
      phone: "+57 1 234 5678",
      manager: "Carlos Rodríguez",
    },
    {
      id: 2,
      name: "Sede Norte",
      address: "Calle 127 #15-45, Bogotá",
      phone: "+57 1 234 5679",
      manager: "Ana García",
    },
  ],
  team: [
    {
      id: 1,
      name: "Carlos Rodríguez",
      email: "carlos@eldorado.com",
      role: "Gerente General",
      status: "active",
    },
    {
      id: 2,
      name: "Ana García",
      email: "ana@eldorado.com",
      role: "Gerente de Marketing",
      status: "active",
    },
  ],
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    marketing: false,
  })

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
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
          <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
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
                  <Input id="business-name" defaultValue={mockBusiness.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-nit">NIT</Label>
                  <Input id="business-nit" defaultValue={mockBusiness.nit} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-email">Email</Label>
                  <Input id="business-email" type="email" defaultValue={mockBusiness.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-phone">Teléfono</Label>
                  <Input id="business-phone" defaultValue={mockBusiness.phone} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-website">Sitio Web</Label>
                  <Input id="business-website" defaultValue={mockBusiness.website} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business-category">Categoría</Label>
                  <Input id="business-category" defaultValue={mockBusiness.category} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="business-description">Descripción</Label>
                <Textarea id="business-description" defaultValue={mockBusiness.description} rows={3} />
              </div>
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Plan actual:</span>
                  <Badge>{mockBusiness.plan}</Badge>
                </div>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Ubicaciones
                  </CardTitle>
                  <CardDescription>Gestiona las ubicaciones de tu empresa</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Ubicación
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBusiness.locations.map((location) => (
                  <Card key={location.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <h3 className="font-semibold">{location.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {location.address}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {location.phone}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Gerente: {location.manager}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Equipo
                  </CardTitle>
                  <CardDescription>Gestiona los miembros de tu equipo</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Invitar Miembro
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockBusiness.team.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                        <Badge variant="outline" className="text-xs">
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.status === "active" ? "default" : "secondary"}>
                        {member.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
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
                  <Label htmlFor="current-password">Contraseña Actual</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div>
                  <Label htmlFor="new-password">Nueva Contraseña</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <Button>Cambiar Contraseña</Button>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold text-destructive mb-4">Zona de Peligro</h3>
                <div className="space-y-4">
                  <div className="p-4 border border-destructive/20 rounded-lg">
                    <h4 className="font-medium mb-2">Eliminar Cuenta</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos.
                    </p>
                    <Button variant="destructive">Eliminar Cuenta</Button>
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
