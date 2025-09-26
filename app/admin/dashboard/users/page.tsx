"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  User,
  Shield,
  Calendar,
  Mail,
  Phone,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  MapPin,
  Loader2,
} from "lucide-react"
import type { AdminDashboardUser } from "@/lib/types"
import { fetchAllUsersForAdmin, updateUserStatus, updateUserNotes } from "@/lib/user-mapping"
import { getAllBranches } from "@/lib/military-ranks"

// No more mock data - using Firebase

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminDashboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [branchFilter, setBranchFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<AdminDashboardUser | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Fetch users from Firebase on component mount
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true)
        setError(null)
        const firebaseUsers = await fetchAllUsersForAdmin()
        setUsers(firebaseUsers)
      } catch (err) {
        setError("Error al cargar usuarios de Firebase")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.militaryId.includes(searchTerm)
    const matchesStatus = statusFilter === "all" || user.status === statusFilter
    const matchesBranch = branchFilter === "all" || user.branch.toLowerCase().includes(branchFilter)
    return matchesSearch && matchesStatus && matchesBranch
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      pending: "secondary",
      rejected: "destructive",
    } as const

    const labels = {
      active: "Activo",
      pending: "Pendiente",
      rejected: "Rechazado",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }


  const handleApprove = async (userId: string) => {
    setActionLoading(userId)
    try {
      await updateUserStatus(userId, "active")
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: "active" } : u)))
    } catch (error) {
      console.error("Error approving user:", error)
      alert("Error al aprobar usuario")
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (userId: string) => {
    setActionLoading(userId)
    try {
      await updateUserStatus(userId, "rejected")
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: "rejected" } : u)))
    } catch (error) {
      console.error("Error rejecting user:", error)
      alert("Error al rechazar usuario")
    } finally {
      setActionLoading(null)
    }
  }

  const exportUsers = () => {
    const csvContent = [
      "Name,Email,Military ID,Rank,Branch,Status,Registration Date,Verification Score",
      ...filteredUsers.map(user =>
        `"${user.name}","${user.email}","${user.militaryId}","${user.rank}","${user.branch}","${user.status}","${user.registrationDate.toLocaleDateString()}"`
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "usuarios_heroes_colombia.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra el proceso de verificación de usuarios militares</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{users.filter((u) => u.status === "pending").length} pendientes</Badge>
          <Badge variant="destructive">{users.filter((u) => u.status === "rejected").length} rechazados</Badge>
          <Button onClick={exportUsers} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="rejected">Rechazados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Fuerza" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las fuerzas</SelectItem>
              {getAllBranches().map(branch => (
                <SelectItem key={branch} value={branch.toLowerCase()}>{branch}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cargando usuarios</h3>
            <p className="text-muted-foreground">Obteniendo datos de Firebase...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Error al cargar usuarios</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    {getStatusBadge(user.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {user.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {user.city}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {user.rank} - {user.branch}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        ID Militar: {user.militaryId}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Registrado: {user.registrationDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span>ID: {user.militaryId}</span>
                    {user.city && <span>Ciudad: {user.city}</span>}
                  </div>
                  {user.notes && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <strong>Notas:</strong> {user.notes}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedUser(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Detalles de {user.name}</DialogTitle>
                      </DialogHeader>
                      {selectedUser && (
                        <Tabs defaultValue="personal" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="personal">Personal</TabsTrigger>
                            <TabsTrigger value="familiares">Familiares</TabsTrigger>
                            <TabsTrigger value="activity">Actividad</TabsTrigger>
                          </TabsList>
                          <TabsContent value="personal" className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Información Personal</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">Nombre completo:</span> {selectedUser.name}
                                  </div>
                                  <div>
                                    <span className="font-medium">Teléfono:</span> {selectedUser.phone}
                                  </div>
                                  <div>
                                    <span className="font-medium">Ciudad:</span> {selectedUser.city}
                                  </div>
                                  <div>
                                    <span className="font-medium">Email:</span> {selectedUser.email}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Información Militar</h4>
                                <div className="space-y-2 text-sm">
                                  <div>
                                    <span className="font-medium">ID Militar:</span> {selectedUser.militaryId}
                                  </div>
                                  <div>
                                    <span className="font-medium">Rango:</span> {selectedUser.rank}
                                  </div>
                                  <div>
                                    <span className="font-medium">Fuerza:</span> {selectedUser.branch}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="familiares" className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Familiares activos</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="font-medium">Nombre completo:</span> {selectedUser.fullName}
                                </div>
                                <div>
                                  <span className="font-medium">ID Militar:</span> {selectedUser.militaryId}
                                </div>
                                {selectedUser.phone && (
                                  <div>
                                    <span className="font-medium">Teléfono:</span> {selectedUser.phone}
                                  </div>
                                )}
                                {selectedUser.city && (
                                  <div>
                                    <span className="font-medium">Ciudad:</span> {selectedUser.city}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                          <TabsContent value="activity" className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Actividad Reciente</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Último acceso: {selectedUser.lastLogin ? selectedUser.lastLogin.toLocaleString() : 'No disponible'}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Registro: {selectedUser.registrationDate.toLocaleString()}
                                </div>
                                {selectedUser.notes && (
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Notas: {selectedUser.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      )}
                    </DialogContent>
                  </Dialog>

                  {user.status === "pending" && actionLoading !== user.id && (
                    <>
                      <Button size="sm" onClick={() => handleApprove(user.id)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleReject(user.id)}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                    </>
                  )}

                  {actionLoading === user.id && (
                    <Button size="sm" disabled>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Procesando...
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {!loading && !error && filteredUsers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron usuarios</h3>
            <p className="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}