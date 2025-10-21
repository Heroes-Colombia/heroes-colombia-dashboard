"use client"

import { useState, useEffect } from "react"
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
  Crown,
  Shield,
  User,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
  Loader2
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getPlanLimits } from "@/lib/plan-limits"
import { PlanLimitBadge, PlanLimitProgress } from "@/components/plan-limit-badge"
import { UpgradePlanButton } from "@/components/upgrade-plan-button"
import { LockedFeature } from "@/components/locked-feature"
import { TeamMemberService } from "@/lib/services/team-member-service"
import type { PlanType, BusinessPermission } from "@/lib/types"

// Firebase Schema V2 - Team member structure
interface TeamMember {
  id: string
  businessId: string
  userId?: string // null if invitation pending
  email: string
  name?: string
  role: BusinessPermission

  // Invitation Status
  invitationStatus: "pending" | "accepted" | "rejected"
  invitedBy: string
  invitedAt: Date
  acceptedAt?: Date

  // Access Control
  isActive: boolean
  permissions: TeamPermissions

  // Metadata
  createdAt: Date
  updatedAt: Date
}

interface TeamPermissions {
  canManagePromotions: boolean
  canViewAnalytics: boolean
  canManageRedemptions: boolean
  canManageTeam: boolean
  canManageLocations: boolean
  canViewBilling: boolean
}

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
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
  const plan: PlanType = businessUser?.plan || "gratis"
  const limits = getPlanLimits(plan)
  const businessId = businessUser?.businessId || businessUser?.id

  // Fetch team members from Firebase
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!businessId) return

      setIsLoading(true)
      try {
        const members = await TeamMemberService.getBusinessTeamMembers(businessId)
        setTeamMembers(members)
      } catch (error) {
        console.error("Error fetching team members:", error)
        alert("Error: No se pudieron cargar los miembros del equipo")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeamMembers()
  }, [businessId])

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || member.invitationStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  const teamLimit = limits.maxUsers === Infinity ? Infinity : limits.maxUsers
  // Count only accepted and pending members (not rejected)
  const activeTeamCount = teamMembers.filter(m => m.invitationStatus !== "rejected").length + 1 // +1 for owner
  const canInviteMore = activeTeamCount < teamLimit

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

  const handleInviteTeamMember = async () => {
    if (!businessId) return

    try {
      // Note: In Schema V2, team members are users with business_roles array
      // This is a placeholder - production would:
      // 1. Check if user exists by email
      // 2. Add business role to their business_roles array
      // 3. Send invitation email if user doesn't exist

      console.log("Inviting team member:", {
        email: newInvitation.email,
        role: newInvitation.role,
        permissions: Object.keys(newInvitation.permissions).filter(
          key => newInvitation.permissions[key as keyof TeamPermissions]
        )
      })

      alert(`Invitación enviada a ${newInvitation.email}. Esta funcionalidad se completará con el flujo de registro de usuarios.`)

      setIsInviteDialogOpen(false)

      // Reset form
      setNewInvitation({
        email: "",
        name: "",
        role: "staff",
        permissions: { ...defaultPermissionsByRole.staff } as TeamPermissions,
      })

      // Refresh team members
      const members = await TeamMemberService.getBusinessTeamMembers(businessId)
      setTeamMembers(members)
    } catch (error) {
      console.error("Error inviting team member:", error)
      alert("Error: No se pudo enviar la invitación")
    }
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Cargando equipo...</span>
      </div>
    )
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
          <PlanLimitBadge
            plan={plan}
            resourceType="users"
            currentCount={activeTeamCount}
            showIcon
          />
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canInviteMore}>
                <Plus className="h-4 w-4 mr-1" />
                Invitar Miembro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Invitar Nuevo Miembro</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Notice about team management */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Gestión de equipo</p>
                      <p className="text-sm text-blue-700">
                        Los miembros del equipo podrán acceder al dashboard según los permisos asignados.
                      </p>
                    </div>
                  </div>
                </div>

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
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Gestionar Promociones</div>
                        <div className="text-xs text-muted-foreground">Crear, editar y eliminar promociones</div>
                      </div>
                      <Switch
                        checked={newInvitation.permissions.canManagePromotions}
                        onCheckedChange={(checked) => handlePermissionChange("canManagePromotions", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Ver Analíticas</div>
                        <div className="text-xs text-muted-foreground">Acceder a métricas y reportes</div>
                      </div>
                      <Switch
                        checked={newInvitation.permissions.canViewAnalytics}
                        onCheckedChange={(checked) => handlePermissionChange("canViewAnalytics", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Gestionar Redenciones</div>
                        <div className="text-xs text-muted-foreground">Procesar redenciones de promociones</div>
                      </div>
                      <Switch
                        checked={newInvitation.permissions.canManageRedemptions}
                        onCheckedChange={(checked) => handlePermissionChange("canManageRedemptions", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Gestionar Ubicaciones</div>
                        <div className="text-xs text-muted-foreground">Administrar ubicaciones del negocio</div>
                      </div>
                      <Switch
                        checked={newInvitation.permissions.canManageLocations}
                        onCheckedChange={(checked) => handlePermissionChange("canManageLocations", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Gestionar Equipo</div>
                        <div className="text-xs text-muted-foreground">Invitar y administrar miembros</div>
                      </div>
                      <Switch
                        checked={newInvitation.permissions.canManageTeam}
                        onCheckedChange={(checked) => handlePermissionChange("canManageTeam", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">Ver Facturación</div>
                        <div className="text-xs text-muted-foreground">Acceder a información de billing</div>
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
                  <Button onClick={handleInviteTeamMember} disabled={!newInvitation.email}>
                    <Send className="h-4 w-4 mr-1" />
                    Enviar Invitación
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Plan Limits Progress */}
      {teamLimit !== Infinity && (
        <PlanLimitProgress
          plan={plan}
          resourceType="users"
          currentCount={activeTeamCount}
        />
      )}

      {/* Plan Limits Warning */}
      {!canInviteMore && (
        <LockedFeature
          currentPlan={plan}
          featureName="Miembros adicionales de equipo"
          requiredPlan={plan === "gratis" ? "basico" : plan === "basico" ? "pro" : "enterprise"}
          description={`Tu plan actual permite hasta ${teamLimit} miembro${teamLimit > 1 ? "s" : ""} del equipo (incluyéndote a ti).`}
          variant="inline"
        />
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
