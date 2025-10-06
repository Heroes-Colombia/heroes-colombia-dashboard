"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Lock, Building2, AlertCircle, Shield, BarChart3 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { loginWithEmail, loginWithGoogle } from "@/lib/auth"
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

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError("")

    try {
      await loginWithGoogle("business")
      router.push("/business/dashboard")
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión con Google.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-5">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-foreground">Héroes Colombia</h1>
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

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button variant="outline" onClick={handleGoogleLogin} disabled={isLoading}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
              </div>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">¿No tienes cuenta? </span>
                <Link href="/register" className="text-primary hover:underline">
                  Regístrate aquí
                </Link>
              </div>

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
