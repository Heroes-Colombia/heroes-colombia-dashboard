"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, CreditCard, Download, AlertCircle, Crown, Zap, Building2, Rocket } from "lucide-react"

const subscriptionPlans = [
  {
    id: "gratis",
    name: "Gratis",
    price: 0,
    period: "mes",
    icon: Building2,
    color: "bg-gray-500",
    features: ["Hasta 3 promociones activas", "Estadísticas básicas", "Soporte por email", "Perfil básico de empresa"],
    limits: {
      promotions: 3,
      analytics: "Básicas",
      support: "Email",
      locations: 1,
    },
  },
  {
    id: "basico",
    name: "Básico",
    price: 49900,
    period: "mes",
    icon: Zap,
    color: "bg-blue-500",
    popular: false,
    features: [
      "Hasta 10 promociones activas",
      "Estadísticas avanzadas",
      "Soporte prioritario",
      "Múltiples ubicaciones (hasta 3)",
      "Gestión de equipo básica",
      "Reportes mensuales",
    ],
    limits: {
      promotions: 10,
      analytics: "Avanzadas",
      support: "Prioritario",
      locations: 3,
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: 99900,
    period: "mes",
    icon: Crown,
    color: "bg-heroes-primary",
    popular: true,
    features: [
      "Promociones ilimitadas",
      "Analytics completos con IA",
      "Soporte 24/7",
      "Ubicaciones ilimitadas",
      "Gestión avanzada de equipo",
      "API personalizada",
      "Reportes en tiempo real",
      "Segmentación de audiencia",
    ],
    limits: {
      promotions: "Ilimitadas",
      analytics: "Completas con IA",
      support: "24/7",
      locations: "Ilimitadas",
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199900,
    period: "mes",
    icon: Rocket,
    color: "bg-heroes-secondary",
    features: [
      "Todo lo de Pro",
      "Gerente de cuenta dedicado",
      "Integración personalizada",
      "SLA garantizado",
      "Capacitación del equipo",
      "Reportes personalizados",
      "Acceso beta a nuevas funciones",
      "Consultoría estratégica",
    ],
    limits: {
      promotions: "Ilimitadas",
      analytics: "Personalizadas",
      support: "Gerente dedicado",
      locations: "Ilimitadas",
    },
  },
]

const mockCurrentPlan = {
  id: "basico",
  name: "Básico",
  nextBilling: "2024-02-15",
  usage: {
    promotions: { used: 7, limit: 10 },
    locations: { used: 2, limit: 3 },
  },
}

const mockInvoices = [
  {
    id: "INV-2024-001",
    date: "2024-01-15",
    amount: 49900,
    status: "paid",
    plan: "Básico",
  },
  {
    id: "INV-2023-012",
    date: "2023-12-15",
    amount: 49900,
    status: "paid",
    plan: "Básico",
  },
  {
    id: "INV-2023-011",
    date: "2023-11-15",
    amount: 0,
    status: "paid",
    plan: "Gratis",
  },
]

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePlanChange = async (planId: string) => {
    setIsProcessing(true)
    setSelectedPlan(planId)

    // Simulate Wompi payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Here you would integrate with Wompi payment gateway
    console.log("[v0] Processing payment for plan:", planId)

    setIsProcessing(false)
    setSelectedPlan(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Facturación y Suscripción</h1>
        <p className="text-muted-foreground">Gestiona tu plan de suscripción y revisa tu historial de facturación</p>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList>
          <TabsTrigger value="current">Plan Actual</TabsTrigger>
          <TabsTrigger value="plans">Cambiar Plan</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Plan Actual: {mockCurrentPlan.name}
              </CardTitle>
              <CardDescription>
                Próxima facturación: {new Date(mockCurrentPlan.nextBilling).toLocaleDateString("es-CO")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Promociones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Usadas</span>
                        <span>
                          {mockCurrentPlan.usage.promotions.used} / {mockCurrentPlan.usage.promotions.limit}
                        </span>
                      </div>
                      <Progress
                        value={(mockCurrentPlan.usage.promotions.used / mockCurrentPlan.usage.promotions.limit) * 100}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Ubicaciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Activas</span>
                        <span>
                          {mockCurrentPlan.usage.locations.used} / {mockCurrentPlan.usage.locations.limit}
                        </span>
                      </div>
                      <Progress
                        value={(mockCurrentPlan.usage.locations.used / mockCurrentPlan.usage.locations.limit) * 100}
                        className="h-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {mockCurrentPlan.usage.promotions.used >= mockCurrentPlan.usage.promotions.limit && (
                <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Has alcanzado el límite de promociones. Considera actualizar tu plan para crear más promociones.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {subscriptionPlans.map((plan) => {
              const Icon = plan.icon
              return (
                <Card key={plan.id} className={`relative ${plan.popular ? "ring-2 ring-heroes-primary" : ""}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-heroes-primary">Más Popular</Badge>
                  )}
                  <CardHeader className="text-center">
                    <div
                      className={`w-12 h-12 rounded-full ${plan.color} flex items-center justify-center mx-auto mb-2`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      {plan.price === 0 ? "Gratis" : formatCurrency(plan.price)}
                      {plan.price > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.id === mockCurrentPlan.id ? "outline" : "default"}
                      disabled={plan.id === mockCurrentPlan.id || isProcessing}
                      onClick={() => handlePlanChange(plan.id)}
                    >
                      {isProcessing && selectedPlan === plan.id
                        ? "Procesando..."
                        : plan.id === mockCurrentPlan.id
                          ? "Plan Actual"
                          : plan.price === 0
                            ? "Cambiar a Gratis"
                            : "Actualizar Plan"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Facturas</CardTitle>
              <CardDescription>Revisa y descarga tus facturas anteriores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{invoice.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.date).toLocaleDateString("es-CO")} • Plan {invoice.plan}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {invoice.amount === 0 ? "Gratis" : formatCurrency(invoice.amount)}
                        </p>
                        <Badge variant={invoice.status === "paid" ? "default" : "destructive"}>
                          {invoice.status === "paid" ? "Pagada" : "Pendiente"}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
