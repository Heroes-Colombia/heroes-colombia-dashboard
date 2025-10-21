import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
  } from "firebase/firestore"
import { db, storage } from "../firebase"
import type { Redemption } from "@/lib/types"
  
export class RedemptionService {
    // Redemption operations
    async getRedemptions(businessId?: string, filters?: { limit?: number; startDate?: Date; endDate?: Date }) {
      let q = query(collection(db, "redemptions"), orderBy("redeemedAt", "desc"))
  
      if (businessId) {
        q = query(q, where("businessId", "==", businessId))
      }
      if (filters?.startDate) {
        q = query(q, where("redeemedAt", ">=", Timestamp.fromDate(filters.startDate)))
      }
      if (filters?.endDate) {
        q = query(q, where("redeemedAt", "<=", Timestamp.fromDate(filters.endDate)))
      }
      if (filters?.limit) {
        q = query(q, limit(filters.limit))
      }
  
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Redemption)
    }

  // ============================================================================
  // SCHEMA V2 FUNCTIONS - New locations subcollection and promotions collection
  // ============================================================================

}