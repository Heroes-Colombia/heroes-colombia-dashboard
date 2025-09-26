"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Plus,
  Search,
  Filter,
  Mail,
  UserCheck,
  UserX,
  Crown,
  Shield,
  User,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Send
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { seedTeamMembers } from "@/lib/seed-data"
import type { TeamMember, TeamPermissions, BusinessPermission } from "@/lib/types"

// Mock data with proper typing
const mockTeamMembers: TeamMember[] = [
  {
    id: "team_001",
    businessId: "current_business",
    userId: "user_002",
    email: "maria.gonzalez@mitienda.com",
    name: "María González",
    role: "manager",
    invitationStatus: "accepted",
    invitedBy: "user_001",
    invitedAt: new Date("2024-05-16"),
    acceptedAt: new Date("2024-05-16"),
    isActive: true,
    permissions: {
      canManagePromotions: true,
      canViewAnalytics: true,
      canManageRedemptions: true,
      canManageTeam: false,
      canManageLocations: true,
      canViewBilling: false,
    },
    createdAt: new Date("2024-05-16"),
    updatedAt: new Date("2024-05-16"),
  },
  {
    id: "team_002",
    businessId: "current_business",
    email: "carlos.rodriguez@mitienda.com",
    name: "Carlos Rodríguez",
    role: "staff",
    invitationStatus: "pending",
    invitedBy: "user_001",
    invitedAt: new Date("2024-06-10"),
    isActive: true,
    permissions: {
      canManagePromotions: false,
      canViewAnalytics: false,
      canManageRedemptions: true,
      canManageTeam: false,
      canManageLocations: false,
      canViewBilling: false,
    },
    createdAt: new Date("2024-06-10"),
    updatedAt: new Date("2024-06-10"),
  },
  {
    id: "team_003",
    businessId: "current_business",
    email: "ana.martinez@mitienda.com",
    name: "Ana Martínez",
    role: "manager",
    invitationStatus: "rejected",
    invitedBy: "user_001",
    invitedAt: new Date("2024-06-05"),
    isActive: false,
    permissions: {
      canManagePromotions: true,
      canViewAnalytics: true,
      canManageRedemptions: true,
      canManageTeam: false,
      canManageLocations: false,
      canViewBilling: false,
    },
    createdAt: new Date("2024-06-05"),
    updatedAt: new Date("2024-06-06"),
  },
]

const roleConfig = {
  owner: {
    label: "Propietario",
    icon: Crown,
    description: "Acceso completo a todas las funciones",
    color: "text-yellow-600",
    variant: "default" as const,
  },
  manager: {
    label: "Gerente",
    icon: Shield,
    description: "Gestión de promociones, analíticas y ubicaciones",
    color: "text-blue-600",
    variant: "secondary" as const,
  },
  staff: {
    label: "Personal",
    icon: User,
    description: "Acceso limitado para operaciones básicas",
    color: "text-gray-600",
    variant: "outline" as const,
  },
}

const defaultPermissionsByRole: Record<BusinessPermission, Partial<TeamPermissions>> = {
  owner: {
    canManagePromotions: true,
    canViewAnalytics: true,
    canManageRedemptions: true,
    canManageTeam: true,
    canManageLocations: true,
    canViewBilling: true,
  },
  manager: {
    canManagePromotions: true,
    canViewAnalytics: true,
    canManageRedemptions: true,
    canManageTeam: false,
    canManageLocations: true,
    canViewBilling: false,
  },
  staff: {
    canManagePromotions: false,
    canViewAnalytics: false,
    canManageRedemptions: true,
    canManageTeam: false,
    canManageLocations: false,
    canViewBilling: false,
  },
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState(mockTeamMembers)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [newInvitation, setNewInvitation] = useState({
    email: "",
    name: "",
    role: "staff" as BusinessPermission,
    permissions: defaultPermissionsByRole.staff as TeamPermissions,
  })

  const { user } = useAuth()
  const businessUser = user as any
  const plan = businessUser?.plan || "gratis"

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || member.invitationStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const getTeamLimits = () => {
    switch (plan) {
      case "gratis":
        return 1
      case "basico":
        return 3
      case "pro":
        return 10
      case "enterprise":
        return Number.POSITIVE_INFINITY
      default:
        return 1
    }
  }

  const teamLimit = getTeamLimits()
  const canInviteMore = teamMembers.filter(m => m.invitationStatus !== "rejected").length < teamLimit

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="destructive">Inactivo</Badge>
    }

    switch (status) {
      case "accepted":
        return <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Activo
        </Badge>
      case "pending":
        return <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pendiente
        </Badge>
      case "rejected":
        return <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Rechazado
        </Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const getRoleBadge = (role: BusinessPermission) => {
    const config = roleConfig[role]
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleRoleChange = (role: BusinessPermission) => {
    setNewInvitation(prev => ({
      ...prev,
      role,
      permissions: { ...defaultPermissionsByRole[role] } as TeamPermissions
    }))
  }

  const handlePermissionChange = (permission: keyof TeamPermissions, value: boolean) => {
    setNewInvitation(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [permission]: value }
    }))
  }

  const handleInviteTeamMember = () => {
    const newMember: TeamMember = {
      id: `team_${Date.now()}`,
      businessId: businessUser?.businessId || "current_business",
      email: newInvitation.email,
      name: newInvitation.name || undefined,
      role: newInvitation.role,
      invitationStatus: "pending",
      invitedBy: businessUser?.id || "current_user",
      invitedAt: new Date(),
      isActive: true,
      permissions: newInvitation.permissions,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setTeamMembers(prev => [...prev, newMember])
    setIsInviteDialogOpen(false)

    // Reset form
    setNewInvitation({
      email: "",
      name: "",
      role: "staff",
      permissions: { ...defaultPermissionsByRole.staff } as TeamPermissions,
    })
  }

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email?.slice(0, 2).toUpperCase() || "??"
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const getPermissionSummary = (permissions: TeamPermissions) => {
    const activePermissions = Object.entries(permissions)
      .filter(([_, value]) => value)
      .length
    const totalPermissions = Object.keys(permissions).length
    return `${activePermissions}/${totalPermissions} permisos`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipo</h1>
          <p className="text-muted-foreground">Invita y gestiona miembros de tu equipo</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {teamMembers.filter(m => m.invitationStatus !== "rejected").length}/
            {teamLimit === Number.POSITIVE_INFINITY ? "∞" : teamLimit} miembros
          </div>
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canInviteMore}>
                <Plus className="h-4 w-4 mr-1" />
                Invitar Miembro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-email">Email *</Label>
                    <Input
                      id="member-email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={newInvitation.email}
                      onChange={(e) => setNewInvitation(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-name">Nombre</Label>
                    <Input
                      id="member-name"
                      placeholder="Nombre completo (opcional)"
                      value={newInvitation.name}
                      onChange={(e) => setNewInvitation(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <Label htmlFor="member-role">Rol</Label>
                  <Select
                    value={newInvitation.role}
                    onValueChange={(value: BusinessPermission) => handleRoleChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Personal</div>
                            <div className="text-xs text-muted-foreground">Acceso básico para operaciones</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="manager">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <div>
                            <div className="font-medium">Gerente</div>
                            <div className="text-xs text-muted-foreground">Gestión de promociones y analíticas</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Permissions */}
                <div className="space-y-4">
                  <Label>Permisos Específicos</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Gestionar Promociones</div>
                        <div className="text-sm text-muted-foreground">Crear, editar y eliminar promociones</div>
                      </div>
                      <Switch
                        checked={newInvitation.permissions.canManagePromotions}
                        onCheckedChange={(checked) => handlePermissionChange("canManagePromotions", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Ver Analíticas</div>
                        <div className="text-sm text-muted-foreground">Acceder a métricas y reportes</div>
                      </div>
                      <Switch
                        checked={newInvitation.permissions.canViewAnalytics}
                        onCheckedChange={(checked) => handlePermissionChange("canViewAnalytics", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Gestionar Redenciones</div>
                        <div className="text-sm text-muted-foreground">Procesar redenciones de promociones</div>
                      </div>
                      <Switch
                        checked={newInvitation.permissions.canManageRedemptions}
                        onCheckedChange={(checked) => handlePermissionChange("canManageRedemptions", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Gestionar Ubicaciones</div>
                        <div className="text-sm text-muted-foreground">Administrar ubicaciones del negocio</div>
                      </div>
                      <Switch
                        checked={newInvitation.permissions.canManageLocations}
                        onCheckedChange={(checked) => handlePermissionChange("canManageLocations", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Ver Facturación</div>
                        <div className="text-sm text-muted-foreground">Acceder a información de billing</div>
                      </div>
                      <Switch
                        checked={newInvitation.permissions.canViewBilling}
                        onCheckedChange={(checked) => handlePermissionChange("canViewBilling", checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleInviteTeamMember}>
                    <Send className="h-4 w-4 mr-1" />
                    Enviar Invitación
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Plan Limits Warning */}
      {!canInviteMore && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Límite de miembros alcanzado</p>
                <p className="text-sm text-yellow-700">
                  Tu plan {plan} permite hasta {teamLimit} miembro{teamLimit > 1 ? "s" : ""} del equipo.
                  <span className="underline cursor-pointer ml-1">Actualizar plan</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current User Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Tu Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(businessUser?.businessName, businessUser?.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{businessUser?.email}</div>
                <div className="text-sm text-muted-foreground">{businessUser?.businessName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getRoleBadge("owner")}
              <Badge variant="default">Activo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar miembros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="accepted">Activos</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="rejected">Rechazados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Members List */}
      <div className="space-y-4">
        {filteredMembers.map((member) => (
          <Card key={member.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {getInitials(member.name, member.email)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{member.name || member.email}</h3>
                      {getRoleBadge(member.role)}
                      {getStatusBadge(member.invitationStatus, member.isActive)}
                    </div>

                    {member.name && (
                      <p className="text-sm text-muted-foreground mb-2">{member.email}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{getPermissionSummary(member.permissions)}</span>
                      <span>Invitado: {formatDate(member.invitedAt)}</span>
                      {member.acceptedAt && (
                        <span>Aceptado: {formatDate(member.acceptedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.invitationStatus === "pending" && (
                    <Button variant="ghost" size="sm">
                      <Mail className="h-4 w-4 mr-1" />
                      Reenviar
                    </Button>
                  )}
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No se encontraron miembros</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Invita a tu primer miembro del equipo para comenzar"}
              </p>
              {!searchTerm && statusFilter === "all" && canInviteMore && (
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Invitar Primer Miembro
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}