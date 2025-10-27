import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore"
import { db } from "../firebase"
import type { FirebaseAnalyticsEvent } from "@/lib/types"

export class AnalyticsEventService {
  /**
   * Fetch analytics events for a business
   * @param businessId - Business ID to filter events
   * @param options - Optional filters (dateRange, eventTypes, locationId)
   */
  static async getAnalyticsEvents(
    businessId: string,
    options?: {
      dateRange?: { from: Date; to: Date }
      eventTypes?: Array<"impression" | "view" | "save" | "share" | "click" | "redemption">
      locationId?: string
      limit?: number
    }
  ): Promise<FirebaseAnalyticsEvent[]> {
    try {
      // Build query
      const eventsRef = collection(db, "analytics_events")
      let q = query(eventsRef, where("business_id", "==", businessId))

      // Add date range filter if provided
      if (options?.dateRange) {
        const fromTimestamp = Timestamp.fromDate(options.dateRange.from)
        const toTimestamp = Timestamp.fromDate(options.dateRange.to)
        q = query(q, where("timestamp", ">=", fromTimestamp), where("timestamp", "<=", toTimestamp))
      }

      // Add location filter if provided
      if (options?.locationId) {
        q = query(q, where("location_id", "==", options.locationId))
      }

      // Order by timestamp (newest first)
      q = query(q, orderBy("timestamp", "desc"))

      // Fetch events
      const snapshot = await getDocs(q)
      let events = snapshot.docs.map((doc) => ({
        id: doc.id,
        event_type: doc.data().event_type,
        entity_type: doc.data().entity_type,
        entity_id: doc.data().entity_id,
        user_id: doc.data().user_id,
        user_type: doc.data().user_type,
        user_rank: doc.data().user_rank,
        user_city: doc.data().user_city,
        business_id: doc.data().business_id,
        location_id: doc.data().location_id,
        session_id: doc.data().session_id,
        timestamp: doc.data().timestamp,
        metadata: doc.data().metadata,
      })) as FirebaseAnalyticsEvent[]

      // Filter by event types if provided (in-memory filter)
      if (options?.eventTypes && options.eventTypes.length > 0) {
        events = events.filter((event) => options.eventTypes!.includes(event.event_type as any))
      }

      // Apply limit if provided
      if (options?.limit) {
        events = events.slice(0, options.limit)
      }

      return events
    } catch (error) {
      console.error("Error fetching analytics events:", error)
      return []
    }
  }

  /**
   * Fetch analytics events for a specific promotion
   */
  static async getPromotionAnalyticsEvents(
    promotionId: string,
    options?: {
      dateRange?: { from: Date; to: Date }
      eventTypes?: Array<"impression" | "view" | "save" | "share" | "click" | "redemption">
    }
  ): Promise<FirebaseAnalyticsEvent[]> {
    try {
      const eventsRef = collection(db, "analytics_events")
      let q = query(
        eventsRef,
        where("entity_type", "==", "promotion"),
        where("entity_id", "==", promotionId)
      )

      // Add date range filter if provided
      if (options?.dateRange) {
        const fromTimestamp = Timestamp.fromDate(options.dateRange.from)
        const toTimestamp = Timestamp.fromDate(options.dateRange.to)
        q = query(q, where("timestamp", ">=", fromTimestamp), where("timestamp", "<=", toTimestamp))
      }

      // Order by timestamp
      q = query(q, orderBy("timestamp", "desc"))

      const snapshot = await getDocs(q)
      let events = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FirebaseAnalyticsEvent[]

      // Filter by event types if provided
      if (options?.eventTypes && options.eventTypes.length > 0) {
        events = events.filter((event) => options.eventTypes!.includes(event.event_type as any))
      }

      return events
    } catch (error) {
      console.error("Error fetching promotion analytics events:", error)
      return []
    }
  }

  /**
   * Get analytics events count by type for a business
   */
  static async getEventCountsByType(
    businessId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<{
    impressions: number
    views: number
    saves: number
    redemptions: number
  }> {
    try {
      const events = await this.getAnalyticsEvents(businessId, { dateRange })

      return {
        impressions: events.filter((e) => e.event_type === "impression").length,
        views: events.filter((e) => e.event_type === "view").length,
        saves: events.filter((e) => e.event_type === "save").length,
        redemptions: events.filter((e) => e.event_type === "redemption").length,
      }
    } catch (error) {
      console.error("Error getting event counts:", error)
      return { impressions: 0, views: 0, saves: 0, redemptions: 0 }
    }
  }
}
