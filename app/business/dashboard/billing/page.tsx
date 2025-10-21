"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Download, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

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

              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm mb-1">¿Quieres cambiar tu plan?</h4>
                      <p className="text-xs text-muted-foreground">
                        Explora nuestros planes y encuentra el que mejor se adapte a tus necesidades
                      </p>
                    </div>
                    <Link href="/business/dashboard/plans">
                      <Button>
                        Ver Planes
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
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
