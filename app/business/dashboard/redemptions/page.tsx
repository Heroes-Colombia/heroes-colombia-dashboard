"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Search,
  Filter,
  QrCode,
  CreditCard,
  Check,
  X,
  Eye,
  Download,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Percent,
  Gift,
  Truck,
  Zap,
  MoreHorizontal
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { seedRedemptions, seedPromotions, seedLocations } from "@/lib/seed-data"
import type { Redemption, Promotion, BusinessLocation } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

// Mock data
const mockRedemptions: (Redemption & { promotion?: Promotion; location?: BusinessLocation })[] = [
  {
    id: "redemption_001",
    promotionId: "promo_001",
    businessId: "current_business",
    locationId: "loc_001",
    userId: "military_user_001",
    userMilitaryId: "12345678",
    userEmail: "militar1@email.com",
    redeemedAt: new Date("2024-06-18T19:30:00"),
    redeemedBy: "user_002",
    redemptionMethod: "manual",
    originalAmount: 45000,
    discountAmount: 9000,
    finalAmount: 36000,
    verificationNotes: "Cédula militar verificada, descuento aplicado correctamente",
    status: "completed",
    createdAt: new Date("2024-06-18T19:30:00"),
    updatedAt: new Date("2024-06-18T19:30:00"),
    promotion: {
      id: "promo_001",
      businessId: "current_business",
      title: "20% de Descuento para Militares",
      description: "Descuento especial para personal militar",
      type: "percentage",
      value: 20,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-06-30"),
      isActive: true,
      status: "active",
      currentRedemptions: 15,
      digitalCardEligible: true,
      targetLocations: ["loc_001"],
      isFeatured: true,
      createdAt: new Date("2024-05-25"),
      updatedAt: new Date("2024-06-15"),
      createdBy: "user_001",
    },
    location: {
      id: "loc_001",
      businessId: "current_business",
      name: "Sede Principal",
      type: "physical",
      isActive: true,
      createdAt: new Date("2024-05-15"),
      updatedAt: new Date("2024-05-15"),
    },
  },
  {
    id: "redemption_002",
    promotionId: "promo_001",
    businessId: "current_business",
    locationId: "loc_001",
    userId: "military_user_002",
    userMilitaryId: "87654321",
    redeemedAt: new Date("2024-06-19T14:15:00"),
    redeemedBy: "user_002",
    redemptionMethod: "qr_code",
    originalAmount: 32000,
    discountAmount: 6400,
    finalAmount: 25600,
    status: "completed",
    createdAt: new Date("2024-06-19T14:15:00"),
    updatedAt: new Date("2024-06-19T14:15:00"),
    promotion: {
      id: "promo_001",
      businessId: "current_business",
      title: "20% de Descuento para Militares",
      description: "Descuento especial para personal militar",
      type: "percentage",
      value: 20,
      startDate: new Date("2024-06-01"),
      endDate: new Date("2024-06-30"),
      isActive: true,
      status: "active",
      currentRedemptions: 15,
      digitalCardEligible: true,
      targetLocations: ["loc_001"],
      isFeatured: true,
      createdAt: new Date("2024-05-25"),
      updatedAt: new Date("2024-06-15"),
      createdBy: "user_001",
    },
    location: {
      id: "loc_001",
      businessId: "current_business",
      name: "Sede Principal",
      type: "physical",
      isActive: true,
      createdAt: new Date("2024-05-15"),
      updatedAt: new Date("2024-05-15"),
    },
  },
]

const mockActivePromotions = [
  {
    id: "promo_001",
    title: "20% de Descuento para Militares",
    type: "percentage",
    value: 20,
  },
  {
    id: "promo_002",
    title: "2x1 en Bebidas",
    type: "bogo",
    value: 0,
  },
  {
    id: "promo_003",
    title: "Envío Gratis",
    type: "free_shipping",
    value: 0,
  },
]

const mockLocations = [
  { id: "loc_001", name: "Sede Principal" },
  { id: "loc_002", name: "Tienda Online" },
]

export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState(mockRedemptions)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [promotionFilter, setPromotionFilter] = useState("all")
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  const [newRedemption, setNewRedemption] = useState({
    promotionId: "",
    userMilitaryId: "",
    locationId: "",
    originalAmount: "",
    discountAmount: "",
    verificationNotes: "",
  })

  const { user } = useAuth()
  const businessUser = user as any

  const filteredRedemptions = redemptions.filter((redemption) => {
    const matchesSearch =
      redemption.userMilitaryId.includes(searchTerm) ||
      redemption.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      redemption.promotion?.title.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || redemption.status === statusFilter
    const matchesPromotion = promotionFilter === "all" || redemption.promotionId === promotionFilter

    return matchesSearch && matchesStatus && matchesPromotion
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="gap-1">
          <Check className="h-3 w-3" />
          Completada
        </Badge>
      case "pending":
        return <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" />
          Pendiente
        </Badge>
      case "cancelled":
        return <Badge variant="destructive" className="gap-1">
          <X className="h-3 w-3" />
          Cancelada
        </Badge>
      default:
        return <Badge variant="outline">Desconocido</Badge>
    }
  }

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "manual":
        return <Badge variant="outline" className="gap-1">
          <User className="h-3 w-3" />
          Manual
        </Badge>
      case "qr_code":
        return <Badge variant="secondary" className="gap-1">
          <QrCode className="h-3 w-3" />
          QR Code
        </Badge>
      case "digital_card":
        return <Badge variant="default" className="gap-1">
          <CreditCard className="h-3 w-3" />
          Tarjeta Digital
        </Badge>
      default:
        return <Badge variant="outline">Otro</Badge>
    }
  }

  const getPromotionIcon = (type: string) => {
    switch (type) {
      case "percentage":
        return <Percent className="h-4 w-4" />
      case "fixed":
        return <DollarSign className="h-4 w-4" />
      case "bogo":
        return <Gift className="h-4 w-4" />
      case "free_shipping":
        return <Truck className="h-4 w-4" />
      case "flash_deal":
        return <Zap className="h-4 w-4" />
      default:
        return <Gift className="h-4 w-4" />
    }
  }

  const calculateFinalAmount = () => {
    const original = parseFloat(newRedemption.originalAmount) || 0
    const discount = parseFloat(newRedemption.discountAmount) || 0
    return Math.max(0, original - discount)
  }

  const handleProcessRedemption = () => {
    const selectedPromotion = mockActivePromotions.find(p => p.id === newRedemption.promotionId)

    const redemptionData = {
      id: `redemption_${Date.now()}`,
      promotionId: newRedemption.promotionId,
      businessId: businessUser?.businessId || "current_business",
      locationId: newRedemption.locationId || undefined,
      userId: `user_${Date.now()}`,
      userMilitaryId: newRedemption.userMilitaryId,
      redeemedAt: new Date(),
      redeemedBy: businessUser?.id || "current_user",
      redemptionMethod: "manual" as const,
      originalAmount: parseFloat(newRedemption.originalAmount) || undefined,
      discountAmount: parseFloat(newRedemption.discountAmount) || undefined,
      finalAmount: calculateFinalAmount(),
      verificationNotes: newRedemption.verificationNotes || undefined,
      status: "completed" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      promotion: selectedPromotion,
      location: mockLocations.find(l => l.id === newRedemption.locationId),
    }

    setRedemptions(prev => [redemptionData as any, ...prev])
    setIsProcessDialogOpen(false)

    // Reset form
    setNewRedemption({
      promotionId: "",
      userMilitaryId: "",
      locationId: "",
      originalAmount: "",
      discountAmount: "",
      verificationNotes: "",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getInitials = (militaryId: string) => {
    return militaryId.slice(-2).toUpperCase()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Redenciones</h1>
          <p className="text-muted-foreground">Gestiona y procesa redenciones de promociones</p>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                Procesar Redención
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Procesar Nueva Redención</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Promotion Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="promotion">Promoción *</Label>
                    <Select
                      value={newRedemption.promotionId}
                      onValueChange={(value) => setNewRedemption(prev => ({ ...prev, promotionId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar promoción" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockActivePromotions.map((promo) => (
                          <SelectItem key={promo.id} value={promo.id}>
                            <div className="flex items-center gap-2">
                              {getPromotionIcon(promo.type)}
                              <span>{promo.title}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Ubicación</Label>
                    <Select
                      value={newRedemption.locationId}
                      onValueChange={(value) => setNewRedemption(prev => ({ ...prev, locationId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ubicación" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{location.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* User Information */}
                <div className="space-y-2">
                  <Label htmlFor="military-id">Cédula Militar *</Label>
                  <Input
                    id="military-id"
                    placeholder="Ej: 12345678"
                    value={newRedemption.userMilitaryId}
                    onChange={(e) => setNewRedemption(prev => ({ ...prev, userMilitaryId: e.target.value }))}
                  />
                </div>

                {/* Transaction Details */}
                <div className="space-y-4">
                  <h3 className="font-medium">Detalles de la Transacción</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="original-amount">Monto Original</Label>
                      <Input
                        id="original-amount"
                        type="number"
                        placeholder="45000"
                        value={newRedemption.originalAmount}
                        onChange={(e) => setNewRedemption(prev => ({ ...prev, originalAmount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount-amount">Descuento</Label>
                      <Input
                        id="discount-amount"
                        type="number"
                        placeholder="9000"
                        value={newRedemption.discountAmount}
                        onChange={(e) => setNewRedemption(prev => ({ ...prev, discountAmount: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Monto Final</Label>
                      <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                        {formatCurrency(calculateFinalAmount())}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Notes */}
                <div className="space-y-2">
                  <Label htmlFor="verification-notes">Notas de Verificación</Label>
                  <Textarea
                    id="verification-notes"
                    placeholder="Cédula militar verificada, descuento aplicado correctamente..."
                    value={newRedemption.verificationNotes}
                    onChange={(e) => setNewRedemption(prev => ({ ...prev, verificationNotes: e.target.value }))}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleProcessRedemption}
                    disabled={!newRedemption.promotionId || !newRedemption.userMilitaryId}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Procesar Redención
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redenciones</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{redemptions.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 desde ayer
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoy</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Redenciones procesadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(redemptions.reduce((sum, r) => sum + (r.finalAmount || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              En redenciones procesadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descuentos</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(redemptions.reduce((sum, r) => sum + (r.discountAmount || 0), 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total en descuentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cédula, email o promoción..."
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
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="completed">Completadas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="cancelled">Canceladas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={promotionFilter} onValueChange={setPromotionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las promociones</SelectItem>
            {mockActivePromotions.map((promo) => (
              <SelectItem key={promo.id} value={promo.id}>
                {promo.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Redemptions List */}
      <div className="space-y-4">
        {filteredRedemptions.map((redemption) => (
          <Card key={redemption.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {getInitials(redemption.userMilitaryId)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Cédula: {redemption.userMilitaryId}</h3>
                      {getStatusBadge(redemption.status)}
                      {getMethodBadge(redemption.redemptionMethod)}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      {redemption.promotion && getPromotionIcon(redemption.promotion.type)}
                      <span className="font-medium">{redemption.promotion?.title}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="block font-medium text-foreground">Fecha</span>
                        {format(redemption.redeemedAt, "dd MMM yyyy", { locale: es })}
                        <br />
                        {format(redemption.redeemedAt, "HH:mm")}
                      </div>
                      {redemption.location && (
                        <div>
                          <span className="block font-medium text-foreground">Ubicación</span>
                          {redemption.location.name}
                        </div>
                      )}
                      {redemption.originalAmount && (
                        <div>
                          <span className="block font-medium text-foreground">Monto Original</span>
                          {formatCurrency(redemption.originalAmount)}
                        </div>
                      )}
                      {redemption.discountAmount && (
                        <div>
                          <span className="block font-medium text-foreground">Descuento</span>
                          <span className="text-green-600">
                            -{formatCurrency(redemption.discountAmount)}
                          </span>
                        </div>
                      )}
                    </div>

                    {redemption.finalAmount && (
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Monto Final</span>
                          <span className="text-lg font-bold">{formatCurrency(redemption.finalAmount)}</span>
                        </div>
                      </div>
                    )}

                    {redemption.verificationNotes && (
                      <div className="mt-3 p-3 border rounded-lg">
                        <span className="text-sm font-medium">Notas de Verificación:</span>
                        <p className="text-sm text-muted-foreground mt-1">
                          {redemption.verificationNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
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
      {filteredRedemptions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No se encontraron redenciones</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all" || promotionFilter !== "all"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Procesa tu primera redención para comenzar"}
              </p>
              {!searchTerm && statusFilter === "all" && promotionFilter === "all" && (
                <Button onClick={() => setIsProcessDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Procesar Primera Redención
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}