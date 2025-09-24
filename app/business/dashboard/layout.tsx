"use client"

import type React from "react"

import { useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { HeroesLogo } from "@/components/heroes-logo"
import { BarChart3, Building2, CreditCard, MapPin, Menu, Settings, Tag, Users, LogOut, Bell, Crown } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { getCurrentUser, mockLogout } from "@/lib/auth"

const navigation = [
  { name: "Resumen", href: "/business/dashboard", icon: BarChart3 },
  { name: "Promociones", href: "/business/dashboard/promotions", icon: Tag },
  { name: "Redenciones", href: "/business/dashboard/redemptions", icon: Building2 },
  { name: "Analíticas", href: "/business/dashboard/analytics", icon: BarChart3 },
  { name: "Facturación", href: "/business/dashboard/billing", icon: CreditCard },
  { name: "Ubicaciones", href: "/business/dashboard/locations", icon: MapPin },
  { name: "Equipo", href: "/business/dashboard/team", icon: Users },
  { name: "Configuración", href: "/business/dashboard/settings", icon: Settings },
]

export default function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const user = getCurrentUser("business") as any
  const isPremium = user?.plan === "pro" || user?.plan === "enterprise"

  const handleLogout = () => {
    mockLogout("business")
    router.push("/business/login")
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center px-4">
        <HeroesLogo />
      </div>
      <nav className="flex flex-1 flex-col px-4 pb-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => mobile && setSidebarOpen(false)}
                      className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
          <li className="mt-auto">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Plan Actual</span>
                  {isPremium && <Crown className="h-4 w-4 text-primary" />}
                </div>
                <Badge variant={isPremium ? "default" : "secondary"} className="mb-2">
                  {user?.plan?.toUpperCase() || "GRATIS"}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {isPremium ? "Acceso completo a todas las funciones" : "Funciones básicas disponibles"}
                </p>
              </CardContent>
            </Card>
          </li>
        </ul>
      </nav>
    </div>
  )

  return (
    <AuthGuard requiredRole="business">
      <div className="h-screen flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card">
            <Sidebar />
          </div>
        </div>

        {/* Mobile sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-72">
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-card">
              <Sidebar mobile />
            </div>
          </SheetContent>
        </Sheet>

        <div className="lg:pl-72 flex flex-col flex-1">
          {/* Top bar */}
          <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
              <div className="flex flex-1 items-center">
                <h1 className="text-lg font-semibold text-foreground">
                  {user?.businessName || "Dashboard Empresarial"}
                </h1>
              </div>
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
