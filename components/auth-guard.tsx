"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { HeroesLogo } from "@/components/heroes-logo"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "business" | "admin"
  redirectTo?: string
}

export function AuthGuard({ children, requiredRole = "business", redirectTo }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return

    if (!user) {
      setIsAuthenticated(false)
      const loginPath = redirectTo || `/`
      router.push(loginPath)
      return
    }

    if (user.role !== requiredRole) {
      setIsAuthenticated(false)
      const loginPath = redirectTo || `/`
      router.push(loginPath)
      return
    }

    setIsAuthenticated(true)
  }, [user, loading, requiredRole, redirectTo, router])

  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <HeroesLogo variant="auth" className="mb-4" />
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground mt-2">Verificando acceso...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Redirecting
  }

  return <>{children}</>
}
