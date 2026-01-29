import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit as firestoreLimit,
} from "firebase/firestore"
import { db } from "../firebase"
import type {
  BusinessNotification,
  FirebaseBusinessNotification,
  BusinessNotificationType,
  BusinessNotificationStatus,
} from "@/lib/types"

/**
 * Service for managing business notifications (reports & event triggers)
 * Part of the Automated Engagement System - Part B
 */
export class BusinessNotificationService {
  private static readonly COLLECTION = "business_notifications"

  /**
   * Convert Firebase Timestamp to Date
   */
  private static toDate(timestamp: Timestamp | undefined): Date | undefined {
    if (!timestamp) return undefined
    return timestamp.toDate()
  }

  /**
   * Map Firebase document to dashboard BusinessNotification type
   */
  private static mapToNotification(
    id: string,
    data: FirebaseBusinessNotification
  ): BusinessNotification {
    return {
      id,
      business_id: data.business_id,
      notification_type: data.notification_type,
      status: data.status,

      trigger_data: {
        promotion_id: data.trigger_data?.promotion_id,
        promotion_title: data.trigger_data?.promotion_title,
        user_rank: data.trigger_data?.user_rank,
        cta_type: data.trigger_data?.cta_type,
        missing_fields: data.trigger_data?.missing_fields,
        period: data.trigger_data?.period,
        stats: data.trigger_data?.stats,
      },

      email_content: {
        subject: data.email_content?.subject || "",
        body_html: data.email_content?.body_html || "",
        cta_text: data.email_content?.cta_text,
        cta_url: data.email_content?.cta_url,
      },

      created_at: this.toDate(data.created_at)!,
      sent_at: this.toDate(data.sent_at),

      recipient_email: data.recipient_email,
      owner_name: data.owner_name,
      business_name: data.business_name,
    }
  }

  /**
   * Get notifications for a specific business
   */
  static async getBusinessNotifications(
    businessId: string,
    filters?: {
      type?: BusinessNotificationType
      status?: BusinessNotificationStatus
      limit?: number
    }
  ): Promise<BusinessNotification[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where("business_id", "==", businessId),
        orderBy("created_at", "desc")
      )

      const snapshot = await getDocs(q)

      let notifications = snapshot.docs.map((doc) =>
        this.mapToNotification(doc.id, doc.data() as FirebaseBusinessNotification)
      )

      // Apply filters in memory
      if (filters?.type) {
        notifications = notifications.filter(
          (n) => n.notification_type === filters.type
        )
      }
      if (filters?.status) {
        notifications = notifications.filter((n) => n.status === filters.status)
      }
      if (filters?.limit) {
        notifications = notifications.slice(0, filters.limit)
      }

      return notifications
    } catch (error) {
      console.error("Error fetching business notifications:", error)
      return []
    }
  }

  /**
   * Get all notifications (for admin dashboard)
   */
  static async getAllNotifications(filters?: {
    type?: BusinessNotificationType
    status?: BusinessNotificationStatus
    limit?: number
  }): Promise<BusinessNotification[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        orderBy("created_at", "desc")
      )

      const snapshot = await getDocs(q)

      let notifications = snapshot.docs.map((doc) =>
        this.mapToNotification(doc.id, doc.data() as FirebaseBusinessNotification)
      )

      // Apply filters
      if (filters?.type) {
        notifications = notifications.filter(
          (n) => n.notification_type === filters.type
        )
      }
      if (filters?.status) {
        notifications = notifications.filter((n) => n.status === filters.status)
      }
      if (filters?.limit) {
        notifications = notifications.slice(0, filters.limit)
      }

      return notifications
    } catch (error) {
      console.error("Error fetching all notifications:", error)
      return []
    }
  }

  /**
   * Get a single notification by ID
   */
  static async getNotification(
    notificationId: string
  ): Promise<BusinessNotification | null> {
    try {
      const docRef = doc(db, this.COLLECTION, notificationId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      return this.mapToNotification(
        docSnap.id,
        docSnap.data() as FirebaseBusinessNotification
      )
    } catch (error) {
      console.error("Error fetching notification:", error)
      return null
    }
  }

  /**
   * Get recent reports for a business (weekly/monthly)
   */
  static async getRecentReports(
    businessId: string,
    limitCount: number = 10
  ): Promise<BusinessNotification[]> {
    return this.getBusinessNotifications(businessId, {
      limit: limitCount,
    }).then((notifications) =>
      notifications.filter(
        (n) =>
          n.notification_type === "weekly_report" ||
          n.notification_type === "monthly_report"
      )
    )
  }

  /**
   * Get notification statistics for a business
   */
  static async getBusinessNotificationStats(businessId: string): Promise<{
    total_reports_sent: number
    last_weekly_report: Date | null
    last_monthly_report: Date | null
    total_alerts_sent: number
    pending_notifications: number
  }> {
    try {
      const notifications = await this.getBusinessNotifications(businessId)

      const reports = notifications.filter(
        (n) =>
          n.notification_type === "weekly_report" ||
          n.notification_type === "monthly_report"
      )

      const alerts = notifications.filter(
        (n) =>
          n.notification_type !== "weekly_report" &&
          n.notification_type !== "monthly_report"
      )

      const sentReports = reports.filter((r) => r.status === "sent")
      const weeklyReports = sentReports.filter(
        (r) => r.notification_type === "weekly_report"
      )
      const monthlyReports = sentReports.filter(
        (r) => r.notification_type === "monthly_report"
      )

      return {
        total_reports_sent: sentReports.length,
        last_weekly_report:
          weeklyReports.length > 0 ? weeklyReports[0].sent_at || null : null,
        last_monthly_report:
          monthlyReports.length > 0 ? monthlyReports[0].sent_at || null : null,
        total_alerts_sent: alerts.filter((a) => a.status === "sent").length,
        pending_notifications: notifications.filter(
          (n) => n.status === "pending"
        ).length,
      }
    } catch (error) {
      console.error("Error getting notification stats:", error)
      return {
        total_reports_sent: 0,
        last_weekly_report: null,
        last_monthly_report: null,
        total_alerts_sent: 0,
        pending_notifications: 0,
      }
    }
  }

  /**
   * Get admin overview statistics
   */
  static async getAdminStats(): Promise<{
    total_sent_today: number
    reports_sent_this_week: number
    alerts_sent_this_week: number
    failed_notifications: number
  }> {
    try {
      const notifications = await this.getAllNotifications()

      const now = new Date()
      const startOfDay = new Date(now)
      startOfDay.setHours(0, 0, 0, 0)

      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - now.getDay())
      startOfWeek.setHours(0, 0, 0, 0)

      const sentToday = notifications.filter(
        (n) => n.status === "sent" && n.sent_at && n.sent_at >= startOfDay
      )

      const sentThisWeek = notifications.filter(
        (n) => n.status === "sent" && n.sent_at && n.sent_at >= startOfWeek
      )

      const reportsThisWeek = sentThisWeek.filter(
        (n) =>
          n.notification_type === "weekly_report" ||
          n.notification_type === "monthly_report"
      )

      const alertsThisWeek = sentThisWeek.filter(
        (n) =>
          n.notification_type !== "weekly_report" &&
          n.notification_type !== "monthly_report"
      )

      const failed = notifications.filter((n) => n.status === "failed")

      return {
        total_sent_today: sentToday.length,
        reports_sent_this_week: reportsThisWeek.length,
        alerts_sent_this_week: alertsThisWeek.length,
        failed_notifications: failed.length,
      }
    } catch (error) {
      console.error("Error getting admin stats:", error)
      return {
        total_sent_today: 0,
        reports_sent_this_week: 0,
        alerts_sent_this_week: 0,
        failed_notifications: 0,
      }
    }
  }

  /**
   * Get notification type display name
   */
  static getNotificationTypeLabel(type: BusinessNotificationType): string {
    const labels: Record<BusinessNotificationType, string> = {
      promotion_expired: "Promoción Expirada",
      no_active_promotions: "Sin Promociones Activas",
      incomplete_profile: "Perfil Incompleto",
      new_favourite: "Nuevo Favorito",
      cta_clicked: "Clic en CTA",
      weekly_report: "Reporte Semanal",
      monthly_report: "Reporte Mensual",
    }
    return labels[type] || type
  }

  /**
   * Get notification type icon name (for UI)
   */
  static getNotificationTypeIcon(
    type: BusinessNotificationType
  ): string {
    const icons: Record<BusinessNotificationType, string> = {
      promotion_expired: "clock",
      no_active_promotions: "alert-triangle",
      incomplete_profile: "user-x",
      new_favourite: "heart",
      cta_clicked: "mouse-pointer",
      weekly_report: "calendar",
      monthly_report: "calendar-check",
    }
    return icons[type] || "bell"
  }
}
