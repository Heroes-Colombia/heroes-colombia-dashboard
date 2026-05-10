"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Megaphone,
  Bell,
  Mail,
  Smartphone,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Loader2,
  Eye,
  RefreshCw,
} from "lucide-react"
import type { Campaign, CampaignStatus, CampaignType } from "@/lib/types"
import { CampaignService } from "@/lib/services/campaign-service"
import { CampaignDetailDialog } from "@/components/campaigns/campaign-detail-dialog"

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [stats, setStats] = useState({ pending: 0, sent_today: 0, total_sent_this_month: 0 })

  const loadCampaigns = async () => {
    setIsLoading(true)
    try {
      const [campaignsData, statsData] = await Promise.all([
        CampaignService.getCampaigns(),
        CampaignService.getCampaignStats(),
      ])
      setCampaigns(campaignsData)
      setStats(statsData)
    } catch (error) {
      console.error("Error loading campaigns:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  const filteredCampaigns = campaigns.filter((campaign) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      campaign.push_content?.title?.toLowerCase().includes(searchLower) ||
      campaign.push_content?.body?.toLowerCase().includes(searchLower) ||
      campaign.email_content?.subject?.toLowerCase().includes(searchLower) ||
      campaign.inapp_content?.title?.toLowerCase().includes(searchLower) ||
      campaign.content_category?.toLowerCase().includes(searchLower)

    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    const matchesType = typeFilter === "all" || campaign.campaign_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: CampaignStatus) => {
    const config = {
      draft: { variant: "secondary" as const, label: "Borrador", icon: AlertCircle },
      pending_review: { variant: "default" as const, label: "Pendiente", icon: Clock },
      approved: { variant: "default" as const, label: "Aprobada", icon: CheckCircle },
      sending: { variant: "default" as const, label: "Enviando", icon: Loader2 },
      sent: { variant: "outline" as const, label: "Enviada", icon: CheckCircle },
      failed: { variant: "destructive" as const, label: "Fallida", icon: XCircle },
      cancelled: { variant: "secondary" as const, label: "Cancelada", icon: XCircle },
    }

    const { variant, label, icon: Icon } = config[status] || config.draft

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${status === "sending" ? "animate-spin" : ""}`} />
        {label}
      </Badge>
    )
  }

  const getTypeBadge = (type: CampaignType) => {
    const config = {
      push: { icon: Bell, label: "Push", color: "bg-blue-100 text-blue-800" },
      inapp: { icon: Smartphone, label: "In-App", color: "bg-purple-100 text-purple-800" },
      email: { icon: Mail, label: "Email", color: "bg-green-100 text-green-800" },
    }

    const { icon: Icon, label, color } = config[type]

    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      promotional: "Promocional",
      thematic: "Temático",
      news: "Noticias",
      tips: "Tips",
    }
    return labels[category] || category
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("es-CO", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleViewCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign)
    setIsDetailOpen(true)
  }

  const handleDialogClose = () => {
    setIsDetailOpen(false)
    requestAnimationFrame(() => setSelectedCampaign(null))
  }

  const handleCampaignUpdated = () => {
    loadCampaigns()
    // Defer dialog close by one frame so Radix finishes unmounting the
    // AlertDialog portal (focus trap teardown) before the parent Dialog unmounts.
    // Without this, both dialogs unmount simultaneously and Radix leaves
    // pointer-events: none on the body, locking the entire page.
    requestAnimationFrame(() => {
      handleDialogClose()
    })
  }

  const getCampaignTitle = (campaign: Campaign) => {
    if (campaign.push_content?.title) return campaign.push_content.title
    if (campaign.email_content?.subject) return campaign.email_content.subject
    if (campaign.inapp_content?.title) return campaign.inapp_content.title
    return "Sin título"
  }

  const getCampaignPreview = (campaign: Campaign) => {
    if (campaign.push_content?.body) return campaign.push_content.body
    if (campaign.email_content?.preheader) return campaign.email_content.preheader
    if (campaign.inapp_content?.body) return campaign.inapp_content.body
    return "Sin contenido"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Campañas</h1>
          <p className="text-muted-foreground">
            Revisa, aprueba y gestiona las campañas de engagement
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {stats.pending > 0 && (
            <Badge variant="default" className="bg-yellow-500">
              {stats.pending} pendiente{stats.pending !== 1 ? "s" : ""}
            </Badge>
          )}
          <Badge variant="outline">{stats.sent_today} hoy</Badge>
          <Badge variant="secondary">{stats.total_sent_this_month} este mes</Badge>
          <Button onClick={loadCampaigns} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campañas..."
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
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending_review">Pendientes</SelectItem>
              <SelectItem value="approved">Aprobadas</SelectItem>
              <SelectItem value="sending">Enviando</SelectItem>
              <SelectItem value="sent">Enviadas</SelectItem>
              <SelectItem value="failed">Fallidas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              <SelectItem value="push">Push</SelectItem>
              <SelectItem value="inapp">In-App</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Cargando campañas...</p>
            </CardContent>
          </Card>
        ) : filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron campañas</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Las campañas se generan automáticamente según el calendario"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${campaign.status === "pending_review"
                    ? "ring-2 ring-yellow-400 ring-opacity-50"
                    : ""
                  }`}
                onClick={() => handleViewCampaign(campaign)}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {getTypeBadge(campaign.campaign_type)}
                          {getStatusBadge(campaign.status)}
                          <Badge variant="outline">{getCategoryLabel(campaign.content_category)}</Badge>
                        </div>
                        <h3 className="text-lg font-semibold truncate">
                          {getCampaignTitle(campaign)}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {getCampaignPreview(campaign)}
                        </p>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Programado: {formatDate(campaign.scheduled_for)}</span>
                      </div>
                      {campaign.sent_at && (
                        <div className="flex items-center gap-1">
                          <Send className="h-4 w-4" />
                          <span>Enviado: {formatDate(campaign.sent_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Analytics (if sent) */}
                    {campaign.status === "sent" && campaign.analytics && (
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{campaign.analytics.total_recipients} destinatarios</span>
                        </div>
                        {campaign.analytics.push_sent > 0 && (
                          <div className="flex items-center gap-1">
                            <Bell className="h-4 w-4 text-blue-500" />
                            <span>{campaign.analytics.push_sent} push</span>
                          </div>
                        )}
                        {campaign.analytics.email_sent > 0 && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4 text-green-500" />
                            <span>{campaign.analytics.email_sent} emails</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Campaign Detail Dialog */}
      <CampaignDetailDialog
        campaign={selectedCampaign}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onCampaignUpdated={handleCampaignUpdated}
      />
    </div>
  )
}
