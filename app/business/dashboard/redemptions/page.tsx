"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  QrCode,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Clock,
  Scan
} from "lucide-react"

export default function RedemptionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-2xl font-bold text-foreground">Redenciones</h1>
          <Badge variant="secondary">Próximamente</Badge>
        </div>
        <p className="text-muted-foreground">Sistema de seguimiento y verificación de redenciones</p>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-primary/20">
        <CardContent className="py-12">
          <div className="text-center max-w-3xl mx-auto">
            {/* Icon */}
            <div className="mb-6 relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-2">
                <QrCode className="h-10 w-10 text-primary" />
              </div>
              <div className="absolute top-0 right-1/3 inline-flex items-center justify-center w-12 h-12 rounded-full bg-secondary/10">
                <Smartphone className="h-6 w-6 text-secondary" />
              </div>
            </div>

            {/* Title & Description */}
            <h2 className="text-3xl font-bold mb-3">
              Seguimiento de Redenciones
            </h2>
            <p className="text-lg text-muted-foreground mb-2">
              Disponible en Q2 2026
            </p>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Pronto podrás escanear códigos QR de clientes, verificar identificaciones militares
              automáticamente, y hacer seguimiento completo de todas las redenciones en tiempo real.
            </p>

            {/* Current Workflow */}
            <div className="bg-muted/50 p-6 rounded-lg text-left mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">¿Cómo funciona actualmente?</h3>
              </div>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                    1
                  </div>
                  <div>
                    <strong>Los clientes descubren tus promociones</strong>
                    <p className="text-muted-foreground">Ven tu negocio y ofertas en la app móvil de Héroes Colombia</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                    2
                  </div>
                  <div>
                    <strong>Visitan tu negocio o sitio web</strong>
                    <p className="text-muted-foreground">Se acercan a tu establecimiento físico o acceden a tu tienda online</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                    3
                  </div>
                  <div>
                    <strong>Presentan su cédula militar</strong>
                    <p className="text-muted-foreground">Muestran su identificación para verificar que son personal militar activo</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold mt-0.5">
                    4
                  </div>
                  <div>
                    <strong>Aplicas el descuento manualmente</strong>
                    <p className="text-muted-foreground">Verificas la cédula y aplicas la promoción directamente en tu sistema de ventas</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Future Features */}
            <Alert className="text-left">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong className="block mb-2">Próximamente - Sistema Automatizado de Redenciones</strong>
                <div className="grid md:grid-cols-3 gap-4 mt-3">
                  <div className="flex items-start gap-2">
                    <Scan className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <strong className="text-sm">Escaneo QR</strong>
                      <p className="text-xs text-muted-foreground">
                        Escanea el código del cliente desde la app móvil
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <strong className="text-sm">Verificación Automática</strong>
                      <p className="text-xs text-muted-foreground">
                        Valida la identidad militar en tiempo real
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <QrCode className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <strong className="text-sm">Seguimiento Completo</strong>
                      <p className="text-xs text-muted-foreground">
                        Analíticas detalladas de cada redención
                      </p>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Timeline Note */}
            <p className="text-sm text-muted-foreground mt-6">
              Esta funcionalidad será lanzada junto con la actualización de la app móvil en Q2 2026.
              Te notificaremos cuando esté disponible.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
