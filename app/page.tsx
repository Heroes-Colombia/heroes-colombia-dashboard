"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Building2, Users, BarChart3 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground">Héroes Colombia</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma de gestión para conectar personal militar con empresas locales
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-6 w-6 text-primary mr-2" />
                Dashboard Empresarial
              </CardTitle>
              <CardDescription>Gestiona promociones, analíticas y suscripciones para tu negocio</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Crear y gestionar promociones</li>
                <li>• Analíticas detalladas por plan</li>
                <li>• Gestión de ubicaciones y equipo</li>
                <li>• Sistema de redención manual</li>
              </ul>
              <Button onClick={() => router.push("/business/login")} className="w-full">
                Acceder como Empresa
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-6 w-6 text-secondary mr-2" />
                Dashboard Administrativo
              </CardTitle>
              <CardDescription>Panel de control para operadores de la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li>• Gestión de empresas y usuarios</li>
                <li>• Moderación de contenido</li>
                <li>• Analíticas globales</li>
                <li>• Configuración de planes</li>
              </ul>
              <Button onClick={() => router.push("/admin/login")} variant="secondary" className="w-full">
                Acceder como Admin
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary mr-2" />
                Planes de Suscripción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-primary">Gratis</div>
                  <div className="text-muted-foreground">$0 + $10k/promoción</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">Básico</div>
                  <div className="text-muted-foreground">$60,000/mes</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-secondary">Pro</div>
                  <div className="text-muted-foreground">$230,000/mes</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-secondary">Enterprise</div>
                  <div className="text-muted-foreground">Desde $700,000</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
