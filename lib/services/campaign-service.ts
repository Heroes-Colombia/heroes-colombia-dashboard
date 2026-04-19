import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "../firebase"
import type {
  Campaign,
  FirebaseCampaign,
  CampaignStatus,
  CampaignType,
} from "@/lib/types"

/**
 * Service for managing campaigns (consumer engagement notifications)
 * Part of the Automated Engagement System
 */
export class CampaignService {
  private static readonly COLLECTION = "campaigns"

  /**
   * Convert Firebase Timestamp to Date
   */
  private static toDate(timestamp: Timestamp | undefined): Date | undefined {
    if (!timestamp) return undefined
    return timestamp.toDate()
  }

  /**
   * Map Firebase campaign document to dashboard Campaign type
   */
  private static mapToCampaign(id: string, data: FirebaseCampaign): Campaign {
    return {
      id,
      campaign_type: data.campaign_type,
      content_category: data.content_category,
      status: data.status,
      tone: data.tone,
      generated_by: data.generated_by,

      // Timestamps
      created_at: this.toDate(data.created_at)!,
      updated_at: this.toDate(data.updated_at)!,
      scheduled_for: this.toDate(data.scheduled_for)!,
      approved_at: this.toDate(data.approved_at),
      sent_at: this.toDate(data.sent_at),

      // Content
      push_content: data.push_content,
      inapp_content: data.inapp_content,
      email_content: data.email_content,

      // Sources
      content_sources: data.content_sources || {
        top_promotions: [],
        under_promoted: [],
        enterprise_businesses: [],
        new_businesses: [],
        categories: [],
      },

      // Analytics
      analytics: data.analytics || {
        total_recipients: 0,
        push_sent: 0,
        email_sent: 0,
        inapp_configured: false,
      },

      // Approval
      approval: {
        reviewed_by: data.approval?.reviewed_by,
        approved_by: data.approval?.approved_by,
        rejected_by: data.approval?.rejected_by,
        rejection_reason: data.approval?.rejection_reason,
        edits_made: data.approval?.edits_made || false,
      },
    }
  }

  /**
   * Get all campaigns with optional filters
   */
  static async getCampaigns(filters?: {
    status?: CampaignStatus
    campaignType?: CampaignType
    limit?: number
  }): Promise<Campaign[]> {
    try {
      let q = query(
        collection(db, this.COLLECTION),
        orderBy("scheduled_for", "desc")
      )

      // Note: Firestore requires composite indexes for multiple where clauses
      // For now, we filter in memory for flexibility
      const snapshot = await getDocs(q)

      let campaigns = snapshot.docs.map((doc) =>
        this.mapToCampaign(doc.id, doc.data() as FirebaseCampaign)
      )

      // Apply filters in memory
      if (filters?.status) {
        campaigns = campaigns.filter((c) => c.status === filters.status)
      }
      if (filters?.campaignType) {
        campaigns = campaigns.filter(
          (c) => c.campaign_type === filters.campaignType
        )
      }

      // Apply limit
      if (filters?.limit) {
        campaigns = campaigns.slice(0, filters.limit)
      }

      return campaigns
    } catch (error) {
      console.error("Error fetching campaigns:", error)
      return []
    }
  }

  /**
   * Get campaigns pending review
   */
  static async getPendingCampaigns(): Promise<Campaign[]> {
    return this.getCampaigns({ status: "pending_review" })
  }

  /**
   * Get a single campaign by ID
   */
  static async getCampaign(campaignId: string): Promise<Campaign | null> {
    try {
      const docRef = doc(db, this.COLLECTION, campaignId)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      return this.mapToCampaign(docSnap.id, docSnap.data() as FirebaseCampaign)
    } catch (error) {
      console.error("Error fetching campaign:", error)
      return null
    }
  }

  /**
   * Approve a campaign for sending
   */
  static async approveCampaign(
    campaignId: string,
    adminUid: string
  ): Promise<boolean> {
    try {
      const docRef = doc(db, this.COLLECTION, campaignId)
      await updateDoc(docRef, {
        status: "approved",
        "approval.approved_by": adminUid,
        approved_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      })
      return true
    } catch (error) {
      console.error("Error approving campaign:", error)
      return false
    }
  }

  /**
   * Reject a campaign with reason
   */
  static async rejectCampaign(
    campaignId: string,
    adminUid: string,
    reason: string
  ): Promise<boolean> {
    try {
      const docRef = doc(db, this.COLLECTION, campaignId)
      await updateDoc(docRef, {
        status: "cancelled",
        "approval.rejected_by": adminUid,
        "approval.rejection_reason": reason,
        updated_at: Timestamp.now(),
      })
      return true
    } catch (error) {
      console.error("Error rejecting campaign:", error)
      return false
    }
  }

  /**
   * Update campaign content (for editing before approval)
   */
  static async updateContent(
    campaignId: string,
    content: {
      push_content?: Campaign["push_content"]
      inapp_content?: Campaign["inapp_content"]
      email_content?: Campaign["email_content"]
    },
    adminUid: string
  ): Promise<boolean> {
    try {
      const updateData: Record<string, any> = {
        updated_at: Timestamp.now(),
        "approval.edits_made": true,
        "approval.reviewed_by": adminUid,
      }

      // Try to snapshot original content on first edit (non-blocking if it fails)
      try {
        const existing = await this.getCampaign(campaignId)
        if (existing && !existing.approval.edits_made) {
          updateData["approval.original_content"] = {
            push_content: existing.push_content,
            inapp_content: existing.inapp_content,
            email_content: existing.email_content,
          }
        }
      } catch {
        // Original content snapshot is best-effort; don't block the save
      }

      if (content.push_content) updateData.push_content = content.push_content
      if (content.inapp_content) updateData.inapp_content = content.inapp_content
      if (content.email_content) updateData.email_content = content.email_content

      const docRef = doc(db, this.COLLECTION, campaignId)
      await updateDoc(docRef, updateData)
      return true
    } catch (error) {
      console.error("Error updating campaign content:", error)
      return false
    }
  }

  /**
   * Get campaign statistics for dashboard
   */
  static async getCampaignStats(): Promise<{
    pending: number
    sent_today: number
    total_sent_this_month: number
  }> {
    try {
      const campaigns = await this.getCampaigns()

      const now = new Date()
      const startOfDay = new Date(now.setHours(0, 0, 0, 0))
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const pending = campaigns.filter(
        (c) => c.status === "pending_review"
      ).length

      const sent_today = campaigns.filter(
        (c) => c.status === "sent" && c.sent_at && c.sent_at >= startOfDay
      ).length

      const total_sent_this_month = campaigns.filter(
        (c) => c.status === "sent" && c.sent_at && c.sent_at >= startOfMonth
      ).length

      return { pending, sent_today, total_sent_this_month }
    } catch (error) {
      console.error("Error getting campaign stats:", error)
      return { pending: 0, sent_today: 0, total_sent_this_month: 0 }
    }
  }

  /**
   * Cancel a campaign (soft delete)
   */
  static async cancelCampaign(
    campaignId: string,
    adminUid: string
  ): Promise<boolean> {
    try {
      const docRef = doc(db, this.COLLECTION, campaignId)
      await updateDoc(docRef, {
        status: "cancelled",
        "approval.rejected_by": adminUid,
        "approval.rejection_reason": "Cancelled by admin",
        updated_at: Timestamp.now(),
      })
      return true
    } catch (error) {
      console.error("Error cancelling campaign:", error)
      return false
    }
  }
}
