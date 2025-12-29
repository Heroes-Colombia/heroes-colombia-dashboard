"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  User,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Star,
  Tag,
  Activity,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
} from "lucide-react"
import type { AdminDashboardUser } from "@/lib/types"

interface UserDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminDashboardUser | null
  onApprove?: (userId: string) => void
  onReject?: (userId: string) => void
  isLoading?: boolean
}

export function UserDetailDialog({
  open,
  onOpenChange,
  user,
  onApprove,
  onReject,
  isLoading = false,
}: UserDetailDialogProps) {
  const [loadingActivity, setLoadingActivity] = useState(false)


  if (!user) return null

  const getStatusBadge = (status: string) => {
    const config = {
      active: { variant: "default" as const, label: "Activo", color: "text-green-600" },
      pending: { variant: "secondary" as const, label: "Pendiente", color: "text-yellow-600" },
      rejected: { variant: "destructive" as const, label: "Rechazado", color: "text-red-600" },
    }

    const statusConfig = config[status as keyof typeof config] || config.pending
    return (
      <Badge variant={statusConfig.variant}>
        {statusConfig.label}
      </Badge>
    )
  }

  // Determine if user is active (not rejected and status is active)
  const isUserActive = user.status === "active"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalles de Usuario
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Name and Status */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-semibold">{user.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{user.fullName}</p>
            </div>
            {getStatusBadge(user.status)}
          </div>

          <Separator />

          {/* Personal Information */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Información Personal
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">ID:</span>
                  <span>{user.militaryId}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">Email:</span>
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Teléfono:</span>
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Ciudad:</span>
                    <span>{user.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">Registro:</span>
                  <span>{user.registrationDate.toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}</span>
                </div>
                {user.lastLogin && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Activity className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium">Último acceso:</span>
                    <span>{user.lastLogin.toLocaleDateString("es-CO")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Military Information */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Información Militar
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">ID Militar:</span>
                  <span>{user.militaryId}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {user.rank}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                  <span className="font-medium">Fuerza:</span>
                  <Badge variant="secondary" className="text-xs">
                    {user.branch}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Summary */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Resumen de Actividad
              </h4>
              {loadingActivity ? (
                <div className="text-sm text-muted-foreground">Cargando actividad...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {user.favouriteBusinesses?.length || 0}
                    </div>
                    <div className="text-xs text-yellow-600 mt-1">Empresas Favoritas</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Status Info */}
          <Card className={isUserActive ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isUserActive ? (
                    <Unlock className="h-5 w-5 text-green-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-600" />
                  )}
                  <div>
                    <p className="font-medium">Estado de la Cuenta</p>
                    <p className="text-sm text-muted-foreground">
                      {isUserActive
                        ? "La cuenta está activa y puede acceder a la plataforma"
                        : "La cuenta está inactiva o pendiente de aprobación"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-xs text-muted-foreground">
              Usuario ID: <code className="bg-muted px-1 py-0.5 rounded">{user.id}</code>
            </div>
            <div className="flex gap-2">
              {user.status === "pending" && (
                <>
                  {onReject && (
                    <Button
                      variant="outline"
                      onClick={() => onReject(user.id)}
                      disabled={isLoading}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                  )}
                  {onApprove && (
                    <Button
                      onClick={() => onApprove(user.id)}
                      disabled={isLoading}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprobar
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
