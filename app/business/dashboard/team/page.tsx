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
import { PlanType, BusinessPermission, DEFAULT_PERMISSIONS, TeamMember } from "@/lib/types"
import type { TeamPermissions } from "@/lib/types"
import { PlanLimitBadge, PlanLimitProgress } from "@/components/plan-limit-badge"
import { LockedFeature } from "@/components/locked-feature"
import { TeamMemberService } from "@/lib/services/team-member-service"
import { InvitationService } from "@/lib/services/invitation-service"
import { PermissionGuard } from "@/components/permission-guard"

const roleConfig: Record<BusinessPermission, {
  label: string;
  icon: any; // Using 'any' for now to avoid specific LucideIcon typing issues
  description: string;
  color: string;
  variant: "default" | "secondary" | "outline";
}> = {
  [BusinessPermission.owner]: {
    label: "Propietario",
    icon: Crown,
    description: "Acceso completo a todas las funciones",
    color: "text-yellow-600",
    variant: "default" as const,
  },
  [BusinessPermission.manager]: {
    label: "Gerente",
    icon: Shield,
    description: "Gestión de promociones, analíticas y ubicaciones",
    color: "text-blue-600",
    variant: "secondary" as const,
  },
  [BusinessPermission.staff]: {
    label: "Empleado",
    icon: User,
    description: "Acceso limitado para operaciones básicas",
    color: "text-gray-600",
    variant: "outline" as const,
  },
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [newInvitation, setNewInvitation] = useState({
    email: "",
    name: "",
    role: BusinessPermission.staff,
    permissions: { ...DEFAULT_PERMISSIONS[BusinessPermission.staff] } as TeamPermissions,
  })

  const { user } = useAuth()
  const businessUser = user as any
  const plan: PlanType = businessUser?.plan || "gratis"
  const limits = getPlanLimits(plan)
  const businessId = businessUser?.businessId

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

  // Fetch pending invitations
  const fetchPendingInvitations = async () => {
    if (!businessId) return

    try {
      const invitations = await InvitationService.getPendingBusinessInvitations(businessId)
      setPendingInvitations(invitations)
    } catch (error) {
      console.error("Error fetching pending invitations:", error)
    }
  }

  useEffect(() => {
    fetchPendingInvitations()
  }, [businessId])

  const handleResendInvitation = async (invitationId: string, invitation: any) => {
    try {
      await InvitationService.resendInvitation(invitationId)

      const emailResponse = await fetch("/api/send-invitation-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: invitation.invited_email,
          inviterName: invitation.sender_name,
          businessName: invitation.business_name,
          role: roleConfig[invitation.role as BusinessPermission]?.label || invitation.role,
          invitationToken: invitation.invitation_token,
        }),
      })

      if (!emailResponse.ok) {
        throw new Error("Failed to send email")
      }

      alert("Invitación reenviada exitosamente")
    } catch (error) {
      console.error("Error resending invitation:", error)
      alert("Error al reenviar la invitación")
    }
  }

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("¿Estás seguro de cancelar esta invitación?")) return

    try {
      await InvitationService.cancelInvitation(invitationId)
      await fetchPendingInvitations()
      alert("Invitación cancelada")
    } catch (error) {
      console.error("Error cancelling invitation:", error)
      alert("Error al cancelar la invitación")
    }
  }

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || member.status === statusFilter
    return matchesSearch && matchesStatus && member.id !== businessUser?.id
  })

  const teamLimit = limits.maxUsers
  // Count only accepted and pending members (not rejected)
  const activeTeamCount = teamMembers.filter(m => m.status !== "inactive").length // +1 for owner
  const canInviteMore = activeTeamCount < teamLimit

  const getStatusBadge = (status: string, isVerified?: boolean) => {
    if (!isVerified) {
      return <Badge variant="destructive">Pendiente</Badge>
    }

    switch (status) {
      case "active":
        return <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          Activo
        </Badge>
      case "inactive":
        return <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Inactivo
        </Badge>
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  const getRoleBadge = (role: BusinessPermission) => {
    const config = roleConfig[role]
    if (!config) {
      return <Badge variant="outline">{role}</Badge>
    }
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
      permissions: { ...DEFAULT_PERMISSIONS[role] } as TeamPermissions
    }))
  }

  const handlePermissionChange = (permission: keyof TeamPermissions, value: boolean) => {
    setNewInvitation(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [permission]: value }
    }))
  }

  const handleInviteTeamMember = async () => {
    if (!businessId || !newInvitation.email) return

    if (!canInviteMore) {
      alert(`Has alcanzado el límite de ${teamLimit} miembros del equipo para tu plan. Actualiza tu plan para invitar más miembros.`)
      return
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newInvitation.email)) {
      alert("Por favor ingresa un correo electrónico válido")
      return
    }

    setIsLoading(true)
    try {
      // Create invitation
      const invitation = await InvitationService.createBusinessTeamInvitation({
        businessId,
        businessName: businessUser?.businessName || "tu negocio",
        invitedEmail: newInvitation.email.toLowerCase().trim(),
        inviterUid: user?.id,
        inviterEmail: user?.email!,
        inviterName: businessUser?.name || user?.name,
        role: newInvitation.role,
        permissions: newInvitation.permissions,
      })

      // Send email via API route
      const emailResponse = await fetch("/api/send-invitation-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: newInvitation.email.toLowerCase().trim(),
          inviterName: businessUser?.name || businessUser.email!,
          businessName: businessUser?.businessName || "tu negocio",
          role: roleConfig[newInvitation.role].label,
          invitationToken: invitation.invitation_token,
        }),
      })

      if (!emailResponse.ok) {
        console.error("Failed to send email:", await emailResponse.text())
        throw new Error("Failed to send invitation email")
      }

      alert(`✅ Invitación enviada exitosamente a ${newInvitation.email}`)
      setIsInviteDialogOpen(false)

      // Reset form
      setNewInvitation({
        email: "",
        name: "",
        role: BusinessPermission.staff,
        permissions: { ...DEFAULT_PERMISSIONS[BusinessPermission.staff] } as TeamPermissions,
      })

      // Refresh to show pending invitation
      await fetchPendingInvitations()
    } catch (error) {
      console.error("Error inviting team member:", error)
      alert("Error: No se pudo enviar la invitación. Por favor intenta de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!confirm("¿Estás seguro de que deseas remover este miembro del equipo?")) return

    try {
      const success = await TeamMemberService.removeTeamMember(businessId, memberId)
      if (success) {
        const members = await TeamMemberService.getBusinessTeamMembers(businessId)
        setTeamMembers(members)
        alert("Miembro removido del equipo exitosamente")
      } else {
        alert("Error: No se pudo remover el miembro del equipo")
      }
    } catch (error) {
      console.error("Error removing team member:", error)
      alert("Error: No se pudo remover el miembro del equipo")
    }
  }

  const handleToggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    try {
      // This would update the is_active status in business_roles array
      alert(`Cambio de estado pendiente de implementación. Estado actual: ${currentStatus ? "Activo" : "Inactivo"}`)
    } catch (error) {
      console.error("Error toggling member status:", error)
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
    const activePermissions = permissions && Object.entries(permissions)
      .filter(([_, value]) => value)
      .length || 0
    const totalPermissions = permissions && Object.keys(permissions).length || 0
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
          <PermissionGuard
            permission="can_manage_team"
            fallback={
              <Button disabled title="No tienes permiso para gestionar el equipo">
                <Plus className="h-4 w-4 mr-1" />
                Invitar Miembro
              </Button>
            }
          >
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
                          Los miembros del equipo podrán acceder al Portal Web según los permisos asignados.
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
                        <SelectItem value={BusinessPermission.staff}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Personal</div>
                              <div className="text-xs text-muted-foreground">Acceso básico para operaciones</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value={BusinessPermission.manager}>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Gerente</div>
                              <div className="text-xs text-muted-foreground">Gestión de promociones y analíticas</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value={BusinessPermission.owner}>
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Administrador</div>
                              <div className="text-xs text-muted-foreground">Gestión de promociones, equipo y analíticas</div>
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
                          checked={newInvitation.permissions.can_manage_promotions}
                          onCheckedChange={(checked) => handlePermissionChange("can_manage_promotions", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">Ver Analíticas</div>
                          <div className="text-xs text-muted-foreground">Acceder a métricas y reportes</div>
                        </div>
                        <Switch
                          checked={newInvitation.permissions.can_view_analytics}
                          onCheckedChange={(checked) => handlePermissionChange("can_view_analytics", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">Gestionar Redenciones</div>
                          <div className="text-xs text-muted-foreground">Procesar redenciones de promociones</div>
                        </div>
                        <Switch
                          checked={newInvitation.permissions.can_manage_redemptions}
                          onCheckedChange={(checked) => handlePermissionChange("can_manage_redemptions", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">Gestionar Ubicaciones</div>
                          <div className="text-xs text-muted-foreground">Administrar ubicaciones del negocio</div>
                        </div>
                        <Switch
                          checked={newInvitation.permissions.can_manage_locations}
                          onCheckedChange={(checked) => handlePermissionChange("can_manage_locations", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">Gestionar Equipo</div>
                          <div className="text-xs text-muted-foreground">Invitar y administrar miembros</div>
                        </div>
                        <Switch
                          checked={newInvitation.permissions.can_manage_team}
                          onCheckedChange={(checked) => handlePermissionChange("can_manage_team", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">Ver Facturación</div>
                          <div className="text-xs text-muted-foreground">Acceder a información de billing</div>
                        </div>
                        <Switch
                          checked={newInvitation.permissions.can_view_billing}
                          onCheckedChange={(checked) => handlePermissionChange("can_view_billing", checked)}
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
          </PermissionGuard>
        </div>
      </div>

      {/* Plan Limits Progress */}
      <PlanLimitProgress
        plan={plan}
        resourceType="users"
        currentCount={activeTeamCount}
      />

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
                  {getInitials(businessUser?.name, businessUser?.email)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{businessUser?.email}</div>
                <div className="text-sm text-muted-foreground">{businessUser?.businessName}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getRoleBadge(businessUser?.business_roles[0].role)}
              <Badge variant="default">Activo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Invitaciones Pendientes
            </CardTitle>
            <CardDescription>
              Miembros invitados que aún no han aceptado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-orange-100 text-orange-700">
                      <Mail className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{invitation.invited_email}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {getRoleBadge(invitation.role)}
                      <span>•</span>
                      <span>Invitado: {formatDate(invitation.created_at.toDate())}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResendInvitation(invitation.id, invitation)}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Reenviar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelInvitation(invitation.id)}
                  >
                    <XCircle className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

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
                      {getInitials(member.first_name, member.email)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{member.first_name || member.email}</h3>
                      {getRoleBadge(member.business_roles[0].role)}
                      {getStatusBadge(member.status, member.verified || true)}
                    </div>

                    {member.first_name && (
                      <p className="text-sm text-muted-foreground mb-2">{member.email}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{getPermissionSummary(member.business_roles[0].permissions)}</span>
                      <span>Invitado: {formatDate(member.created_at)}</span>
                      {member.status === "active" && (
                        <span>Aceptado: {formatDate(member.updated_at)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <PermissionGuard permission="can_manage_team">
                    {member.status === "pending" && (
                      <Button variant="ghost" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Reenviar
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTeamMember(member.id)}
                      title="Remover miembro"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </PermissionGuard>
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
