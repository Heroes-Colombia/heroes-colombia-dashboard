"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock, AlertCircle, BarChart3 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { loginWithEmail } from "@/lib/auth"
import { HeroesLogo } from "@/components/heroes-logo"
import Link from "next/link"

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const user = await loginWithEmail(email, password)
      console.log(user)
      if (user.role === "business") {
        router.push("/business/dashboard")
      } else {
        router.push("/admin/dashboard")
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión. Verifica tus credenciales.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center mb-6">
            <HeroesLogo variant="auth" />
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Plataforma de gestión para conectar personal militar con empresas locales
          </p>
        </div>


        <div className="bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nombre@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>

              {/* <div className="text-center text-sm">
                <span className="text-muted-foreground">¿No tienes cuenta? </span>
                <Link href="/register" className="text-primary hover:underline">
                  Regístrate aquí
                </Link>
              </div> */}

              <div className="text-center text-sm">
                <Link href="/forgot-password" className="text-muted-foreground hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-5 text-center">
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
                  <div className="text-muted-foreground">$0 + $11k/promoción</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-primary">Básico</div>
                  <div className="text-muted-foreground">$70,000/mes</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-secondary">Pro</div>
                  <div className="text-muted-foreground">$270,000/mes</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-secondary">Enterprise</div>
                  <div className="text-muted-foreground">Desde $800,000</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
