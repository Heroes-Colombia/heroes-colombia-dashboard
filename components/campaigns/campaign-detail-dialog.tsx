"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
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
  Edit,
  Save,
  X,
  Sparkles,
  Users,
  Building2,
  Tag,
} from "lucide-react"
import type { Campaign, CampaignStatus, CampaignType } from "@/lib/types"
import { CampaignService } from "@/lib/services/campaign-service"
import { useAuth } from "@/hooks/use-auth"

interface CampaignDetailDialogProps {
  campaign: Campaign | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCampaignUpdated: () => void
}

export function CampaignDetailDialog({
  campaign,
  open,
  onOpenChange,
  onCampaignUpdated,
}: CampaignDetailDialogProps) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  // Edit state
  const [editedPushTitle, setEditedPushTitle] = useState("")
  const [editedPushBody, setEditedPushBody] = useState("")
  const [editedEmailSubject, setEditedEmailSubject] = useState("")
  const [editedEmailPreheader, setEditedEmailPreheader] = useState("")
  const [editedInAppTitle, setEditedInAppTitle] = useState("")
  const [editedInAppBody, setEditedInAppBody] = useState("")

  if (!campaign) return null

  const canApprove = campaign.status === "pending_review"
  const canEdit = campaign.status === "pending_review" || campaign.status === "draft"
  const canCancel = campaign.status === "pending_review" || campaign.status === "approved"

  const startEditing = () => {
    setEditedPushTitle(campaign.push_content?.title || "")
    setEditedPushBody(campaign.push_content?.body || "")
    setEditedEmailSubject(campaign.email_content?.subject || "")
    setEditedEmailPreheader(campaign.email_content?.preheader || "")
    setEditedInAppTitle(campaign.inapp_content?.title || "")
    setEditedInAppBody(campaign.inapp_content?.body || "")
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const handleSaveEdits = async () => {
    if (!user?.uid) return

    setIsSubmitting(true)
    try {
      const content: Parameters<typeof CampaignService.updateContent>[1] = {}

      if (campaign.campaign_type === "push" && campaign.push_content) {
        content.push_content = {
          ...campaign.push_content,
          title: editedPushTitle,
          body: editedPushBody,
        }
      }

      if (campaign.campaign_type === "email" && campaign.email_content) {
        content.email_content = {
          ...campaign.email_content,
          subject: editedEmailSubject,
          preheader: editedEmailPreheader,
        }
      }

      if (campaign.campaign_type === "inapp" && campaign.inapp_content) {
        content.inapp_content = {
          ...campaign.inapp_content,
          title: editedInAppTitle,
          body: editedInAppBody,
        }
      }

      const success = await CampaignService.updateContent(campaign.id, content, user.uid)

      if (success) {
        setIsEditing(false)
        onCampaignUpdated()
      }
    } catch (error) {
      console.error("Error saving edits:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleApprove = async () => {
    if (!user?.uid) return

    setIsSubmitting(true)
    try {
      const success = await CampaignService.approveCampaign(campaign.id, user.uid)
      if (success) {
        setShowApproveDialog(false)
        onCampaignUpdated()
      }
    } catch (error) {
      console.error("Error approving campaign:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!user?.uid || !rejectionReason.trim()) return

    setIsSubmitting(true)
    try {
      const success = await CampaignService.rejectCampaign(
        campaign.id,
        user.uid,
        rejectionReason
      )
      if (success) {
        setShowRejectDialog(false)
        setRejectionReason("")
        onCampaignUpdated()
      }
    } catch (error) {
      console.error("Error rejecting campaign:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!user?.uid) return

    setIsSubmitting(true)
    try {
      const success = await CampaignService.cancelCampaign(campaign.id, user.uid)
      if (success) {
        onCampaignUpdated()
      }
    } catch (error) {
      console.error("Error cancelling campaign:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: CampaignStatus) => {
    const config = {
      draft: { variant: "secondary" as const, label: "Borrador", icon: AlertCircle },
      pending_review: { variant: "default" as const, label: "Pendiente de Revisión", icon: Clock },
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
      push: { icon: Bell, label: "Push Notification", color: "bg-blue-100 text-blue-800" },
      inapp: { icon: Smartphone, label: "In-App Message", color: "bg-purple-100 text-purple-800" },
      email: { icon: Mail, label: "Email Campaign", color: "bg-green-100 text-green-800" },
    }

    const { icon: Icon, label, color } = config[type]

    return (
      <Badge variant="outline" className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    )
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleString("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    })
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 flex-wrap">
              {getTypeBadge(campaign.campaign_type)}
              {getStatusBadge(campaign.status)}
              {campaign.generated_by === "claude" && (
                <Badge variant="outline" className="flex items-center gap-1 bg-purple-50">
                  <Sparkles className="h-3 w-3" />
                  Generado por IA
                </Badge>
              )}
            </div>
            <DialogTitle className="text-xl mt-2">
              {campaign.push_content?.title ||
                campaign.email_content?.subject ||
                campaign.inapp_content?.title ||
                "Campaña sin título"}
            </DialogTitle>
            <DialogDescription>
              Creada: {formatDate(campaign.created_at)} | Programada: {formatDate(campaign.scheduled_for)}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="content" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Contenido</TabsTrigger>
              <TabsTrigger value="sources">Fuentes</TabsTrigger>
              <TabsTrigger value="analytics">Estadísticas</TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4 mt-4">
              {/* Push Content */}
              {campaign.campaign_type === "push" && campaign.push_content && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Push Notification Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label>Título (máx. 50 caracteres)</Label>
                          <Input
                            value={editedPushTitle}
                            onChange={(e) => setEditedPushTitle(e.target.value)}
                            maxLength={50}
                            placeholder="Título del push"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {editedPushTitle.length}/50 caracteres
                          </p>
                        </div>
                        <div>
                          <Label>Mensaje (máx. 150 caracteres)</Label>
                          <Textarea
                            value={editedPushBody}
                            onChange={(e) => setEditedPushBody(e.target.value)}
                            maxLength={150}
                            placeholder="Cuerpo del mensaje"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {editedPushBody.length}/150 caracteres
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-4 border">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary rounded-lg p-2">
                            <Bell className="h-5 w-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              {campaign.push_content.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {campaign.push_content.body}
                            </p>
                            {campaign.push_content.deep_link && (
                              <p className="text-xs text-blue-600 mt-2">
                                Deep link: {campaign.push_content.deep_link}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Email Content */}
              {campaign.campaign_type === "email" && campaign.email_content && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label>Asunto</Label>
                          <Input
                            value={editedEmailSubject}
                            onChange={(e) => setEditedEmailSubject(e.target.value)}
                            placeholder="Asunto del email"
                          />
                        </div>
                        <div>
                          <Label>Preheader</Label>
                          <Textarea
                            value={editedEmailPreheader}
                            onChange={(e) => setEditedEmailPreheader(e.target.value)}
                            placeholder="Texto de preview"
                            rows={2}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-4 border space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Asunto:</p>
                          <p className="font-semibold">{campaign.email_content.subject}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Preheader:</p>
                          <p className="text-sm">{campaign.email_content.preheader}</p>
                        </div>
                        {campaign.email_content.sections && (
                          <div>
                            <p className="text-xs text-muted-foreground">Secciones:</p>
                            {campaign.email_content.sections.map((section, i) => (
                              <div key={i} className="ml-2 mt-2 border-l-2 pl-2">
                                <p className="font-medium text-sm">{section.headline}</p>
                                <p className="text-xs text-muted-foreground">
                                  {section.promotions?.length || 0} promociones | CTA: {section.cta_text}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* In-App Content */}
              {campaign.campaign_type === "inapp" && campaign.inapp_content && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      In-App Message Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <Label>Título</Label>
                          <Input
                            value={editedInAppTitle}
                            onChange={(e) => setEditedInAppTitle(e.target.value)}
                            placeholder="Título del mensaje"
                          />
                        </div>
                        <div>
                          <Label>Mensaje</Label>
                          <Textarea
                            value={editedInAppBody}
                            onChange={(e) => setEditedInAppBody(e.target.value)}
                            placeholder="Cuerpo del mensaje"
                            rows={3}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/50 rounded-lg p-4 border">
                        {campaign.inapp_content.image_url && (
                          <div className="mb-4 rounded-lg overflow-hidden">
                            <img
                              src={campaign.inapp_content.image_url}
                              alt="In-app banner"
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        )}
                        <p className="font-semibold">{campaign.inapp_content.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {campaign.inapp_content.body}
                        </p>
                        {campaign.inapp_content.button_text && (
                          <Button variant="default" size="sm" className="mt-3" disabled>
                            {campaign.inapp_content.button_text}
                          </Button>
                        )}
                        {campaign.inapp_content.featured_promotions?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-3">
                            Promociones destacadas: {campaign.inapp_content.featured_promotions.length}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Detalles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Categoría</p>
                      <p className="font-medium">{getCategoryLabel(campaign.content_category)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tono</p>
                      <p className="font-medium capitalize">{campaign.tone.replace("_", " ")}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Audiencia</p>
                      <p className="font-medium">Todos los usuarios activos</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Generado por</p>
                      <p className="font-medium">
                        {campaign.generated_by === "claude" ? "Claude AI" : "Manual"}
                      </p>
                    </div>
                    {campaign.approval.edits_made && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Editado por</p>
                        <p className="font-medium">{campaign.approval.reviewed_by || "Admin"}</p>
                      </div>
                    )}
                    {campaign.approval.rejected_by && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Razón de rechazo</p>
                        <p className="font-medium text-destructive">
                          {campaign.approval.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sources Tab */}
            <TabsContent value="sources" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Fuentes de Contenido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {campaign.content_sources.top_promotions?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-sm">Top Promociones</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.content_sources.top_promotions.length} promociones incluidas
                      </p>
                    </div>
                  )}

                  {campaign.content_sources.under_promoted?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-sm">Promociones Subrepresentadas</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.content_sources.under_promoted.length} promociones destacadas
                      </p>
                    </div>
                  )}

                  {campaign.content_sources.enterprise_businesses?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-sm">Negocios Enterprise</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.content_sources.enterprise_businesses.length} negocios enterprise en rotación
                      </p>
                    </div>
                  )}

                  {campaign.content_sources.new_businesses?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-sm">Negocios Nuevos</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.content_sources.new_businesses.length} negocios recién registrados
                      </p>
                    </div>
                  )}

                  {campaign.content_sources.categories?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium text-sm">Categorías</p>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {campaign.content_sources.categories.map((cat, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.values(campaign.content_sources).every(
                    (arr) => !arr || arr.length === 0
                  ) && (
                    <p className="text-sm text-muted-foreground">
                      No hay fuentes de contenido registradas
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Estadísticas de Envío</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">
                        {campaign.analytics.total_recipients}
                      </p>
                      <p className="text-xs text-muted-foreground">Destinatarios</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Bell className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">{campaign.analytics.push_sent}</p>
                      <p className="text-xs text-muted-foreground">Push Enviados</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Mail className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">{campaign.analytics.email_sent}</p>
                      <p className="text-xs text-muted-foreground">Emails Enviados</p>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Smartphone className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                      <p className="text-2xl font-bold">
                        {campaign.analytics.inapp_configured ? "Sí" : "No"}
                      </p>
                      <p className="text-xs text-muted-foreground">In-App Config</p>
                    </div>
                  </div>

                  {campaign.status === "sent" && campaign.sent_at && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Enviado el {formatDate(campaign.sent_at)}
                      </p>
                    </div>
                  )}

                  {campaign.status !== "sent" && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground text-center">
                        Las estadísticas se actualizarán después del envío
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator className="my-4" />

          {/* Action Buttons */}
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={cancelEditing} disabled={isSubmitting}>
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
                <Button onClick={handleSaveEdits} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Guardar Cambios
                </Button>
              </>
            ) : (
              <>
                {canEdit && (
                  <Button variant="outline" onClick={startEditing}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
                {canCancel && (
                  <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancelar Campaña
                  </Button>
                )}
                {canApprove && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={isSubmitting}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setShowApproveDialog(true)}
                      disabled={isSubmitting}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprobar y Enviar
                    </Button>
                  </>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprobar y Enviar Campaña</AlertDialogTitle>
            <AlertDialogDescription>
              Al aprobar esta campaña, se enviará automáticamente a todos los usuarios activos.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Aprobar y Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar Campaña</AlertDialogTitle>
            <AlertDialogDescription>
              Por favor indica el motivo del rechazo. Esta información se guardará para referencia futura.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Motivo del rechazo..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isSubmitting || !rejectionReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-1" />
              )}
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
