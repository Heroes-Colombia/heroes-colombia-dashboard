"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Globe,
  Shield,
  Mail,
  CreditCard,
  Bell,
  Activity,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Server,
  Users,
} from "lucide-react"
import type { SystemSettings } from "@/lib/types"

// Mock system settings data
const mockSystemSettings: SystemSettings = {
  id: "global",
  platformName: "Heroes Colombia",
  platformVersion: "1.2.3",
  maintenanceMode: false,
  autoApproveBusinesses: false,
  autoApprovePromotions: false,
  maxPromotionDuration: 90,
  mailerliteApiKey: "ml-xxxxx-xxxx-xxxx-xxxx",
  emailTemplates: [
    {
      id: "welcome_business",
      name: "Bienvenida Empresa",
      subject: "¡Bienvenido a Heroes Colombia!",
      template: "Estimado {{businessName}}, bienvenido a nuestra plataforma...",
      variables: ["businessName", "loginUrl", "supportEmail"],
    },
    {
      id: "promotion_approved",
      name: "Promoción Aprobada",
      subject: "Tu promoción ha sido aprobada",
      template: "Tu promoción '{{promotionTitle}}' ha sido aprobada y ya está activa...",
      variables: ["promotionTitle", "businessName", "startDate"],
    },
    {
      id: "user_verification",
      name: "Verificación de Usuario",
      subject: "Verifica tu cuenta militar",
      template: "Para completar tu registro, necesitamos verificar tu información militar...",
      variables: ["userName", "verificationUrl", "requiredDocuments"],
    },
  ],
  wompiConfig: {
    publicKey: "pub_test_xxxxx",
    environment: "test",
  },
  notificationRules: [
    {
      id: "business_registration",
      event: "business_registered",
      channels: ["email"],
      recipients: ["admin"],
      template: "business_registration_admin",
    },
    {
      id: "promotion_submitted",
      event: "promotion_submitted",
      channels: ["email"],
      recipients: ["admin"],
      template: "promotion_review_needed",
    },
    {
      id: "high_value_transaction",
      event: "high_value_transaction",
      channels: ["email", "push"],
      recipients: ["admin", "business"],
      template: "transaction_alert",
    },
  ],
  updatedAt: new Date("2024-01-22"),
  updatedBy: "admin@heroescolombia.com",
}

// Mock platform statistics
const platformStats = {
  totalUsers: 1811,
  totalBusinesses: 566,
  totalPromotions: 1247,
  activePromotions: 892,
  monthlyRevenue: 54250000,
  systemUptime: 99.9,
  averageResponseTime: 120,
  errorRate: 0.1,
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(mockSystemSettings)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("platform")

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setHasChanges(false)
    setIsSaving(false)
    alert("Configuraciones guardadas exitosamente")
  }

  const handleResetSettings = () => {
    if (confirm("¿Estás seguro de que quieres restablecer todas las configuraciones?")) {
      setSettings(mockSystemSettings)
      setHasChanges(false)
    }
  }

  const handleTestEmail = () => {
    alert("Email de prueba enviado al administrador")
  }

  const handleTestPayment = () => {
    alert("Conexión con Wompi verificada exitosamente")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración del Sistema</h1>
          <p className="text-muted-foreground">Administra la configuración global de la plataforma</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {settings.maintenanceMode && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Modo Mantenimiento
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            v{settings.platformVersion}
          </Badge>
          {hasChanges && (
            <Button onClick={handleResetSettings} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Restablecer
            </Button>
          )}
          <Button
            onClick={handleSaveSettings}
            disabled={!hasChanges || isSaving}
            size="sm"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Usuarios</span>
            </div>
            <div className="text-2xl font-bold">{platformStats.totalUsers.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Empresas</span>
            </div>
            <div className="text-2xl font-bold">{platformStats.totalBusinesses.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Uptime</span>
            </div>
            <div className="text-2xl font-bold">{platformStats.systemUptime}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Resp. Time</span>
            </div>
            <div className="text-2xl font-bold">{platformStats.averageResponseTime}ms</div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="platform">Plataforma</TabsTrigger>
          <TabsTrigger value="business">Empresas</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        </TabsList>

        {/* Platform Settings */}
        <TabsContent value="platform" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configuración General
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="platformName">Nombre de la Plataforma</Label>
                  <Input
                    id="platformName"
                    value={settings.platformName}
                    onChange={(e) => handleSettingChange("platformName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="platformVersion">Versión</Label>
                  <Input
                    id="platformVersion"
                    value={settings.platformVersion}
                    onChange={(e) => handleSettingChange("platformVersion", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => handleSettingChange("maintenanceMode", checked)}
                />
                <Label htmlFor="maintenanceMode" className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Modo de Mantenimiento
                </Label>
              </div>
              {settings.maintenanceMode && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ El modo de mantenimiento impedirá que los usuarios accedan a la plataforma.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="maxPromotionDuration">Duración Máxima de Promociones (días)</Label>
                <Input
                  id="maxPromotionDuration"
                  type="number"
                  value={settings.maxPromotionDuration}
                  onChange={(e) => handleSettingChange("maxPromotionDuration", parseInt(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Las promociones no podrán tener una duración superior a este valor
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Configuración de Empresas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoApproveBusinesses"
                  checked={settings.autoApproveBusinesses}
                  onCheckedChange={(checked) => handleSettingChange("autoApproveBusinesses", checked)}
                />
                <Label htmlFor="autoApproveBusinesses">
                  Aprobación Automática de Empresas
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Cuando esté habilitado, las nuevas empresas serán aprobadas automáticamente sin revisión manual.
              </p>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autoApprovePromotions"
                  checked={settings.autoApprovePromotions}
                  onCheckedChange={(checked) => handleSettingChange("autoApprovePromotions", checked)}
                />
                <Label htmlFor="autoApprovePromotions">
                  Aprobación Automática de Promociones
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Las promociones serán publicadas inmediatamente sin revisión manual.
              </p>

              {(settings.autoApproveBusinesses || settings.autoApprovePromotions) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800">
                    ⚠️ La aprobación automática puede comprometer la calidad del contenido. Use con precaución.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuración de Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="mailerliteApiKey">MailerLite API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="mailerliteApiKey"
                    type="password"
                    value={settings.mailerliteApiKey || ""}
                    onChange={(e) => handleSettingChange("mailerliteApiKey", e.target.value)}
                    placeholder="ml-xxxxx-xxxx-xxxx-xxxx"
                  />
                  <Button onClick={handleTestEmail} variant="outline">
                    <Mail className="h-4 w-4 mr-1" />
                    Probar
                  </Button>
                </div>
              </div>

              <div>
                <Label>Plantillas de Email</Label>
                <div className="space-y-2 mt-2">
                  {settings.emailTemplates.map((template, _index) => (
                    <Card key={template.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-sm text-muted-foreground">{template.subject}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{template.variables.length} variables</Badge>
                            <Button variant="ghost" size="sm">
                              Editar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Configuración de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="wompiPublicKey">Wompi Public Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="wompiPublicKey"
                    value={settings.wompiConfig?.publicKey || ""}
                    onChange={(e) => handleSettingChange("wompiConfig", {
                      ...settings.wompiConfig,
                      publicKey: e.target.value
                    })}
                    placeholder="pub_test_xxxxx"
                  />
                  <Button onClick={handleTestPayment} variant="outline">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Probar
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="wompiEnvironment">Entorno</Label>
                <Select
                  value={settings.wompiConfig?.environment || "test"}
                  onValueChange={(value: "test" | "production") =>
                    handleSettingChange("wompiConfig", {
                      ...settings.wompiConfig,
                      environment: value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Pruebas</SelectItem>
                    <SelectItem value="production">Producción</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.wompiConfig?.environment === "production" && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    ✅ Configurado para el entorno de producción. Los pagos reales serán procesados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Reglas de Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {settings.notificationRules.map((rule, _index) => (
                  <Card key={rule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium capitalize">
                            {rule.event.replace(/_/g, " ")}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex gap-1">
                              {rule.channels.map(channel => (
                                <Badge key={channel} variant="secondary" className="text-xs">
                                  {channel}
                                </Badge>
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">→</span>
                            <div className="flex gap-1">
                              {rule.recipients.map(recipient => (
                                <Badge key={recipient} variant="outline" className="text-xs">
                                  {recipient}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch defaultChecked />
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button variant="outline" className="w-full">
                <Bell className="h-4 w-4 mr-1" />
                Agregar Nueva Regla
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Info Footer */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground">
            <div>
              Última actualización: {settings.updatedAt.toLocaleString()} por {settings.updatedBy}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <span>Ingresos mensuales: ${platformStats.monthlyRevenue.toLocaleString()}</span>
              <span>Tasa de error: {platformStats.errorRate}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}