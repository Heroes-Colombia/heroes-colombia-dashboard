import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    Timestamp,
  } from "firebase/firestore"
  import { db } from "../firebase"
  import type { Promotion } from "@/lib/types"

export class PromotionService {
  // Promotion operations (NEW - using 'promotions' collection per Schema V2)
  static async getPromotions(filters?: { businessId?: string; status?: string; limit?: number }): Promise<Promotion[]> {
    try {
      const snapshot = await getDocs(collection(db, "promotions"))
      let promotions = snapshot.docs.map((doc) => ({
        id: doc.id,
        business_id: doc.data().business_id,
        title: doc.data().title,
        description: doc.data().description,
        instructions: doc.data().instructions,
        percentage: doc.data().percentage,
        featured_image: doc.data().featured_image,
        location_ids: doc.data().location_ids,
        expired_at: doc.data().expired_at,
        created_at: doc.data().created_at,
        updated_at: doc.data().updated_at,
        status: doc.data().status,
        is_featured: doc.data().is_featured,
        ...doc.data(),
      }))

      // Apply filters in memory
      if (filters?.businessId) {
        promotions = promotions.filter((promo) => promo.business_id === filters.businessId)
      }
      if (filters?.status) {
        promotions = promotions.filter((promo) => promo.status === filters.status)
      }

      // Sort by creation date (newest first)
      promotions.sort((a, b) => {
        const aDate = a.created_at ? (a.created_at as any).seconds || 0 : 0
        const bDate = b.created_at ? (b.created_at as any).seconds || 0 : 0
        return bDate - aDate
      })

      // Apply limit
      if (filters?.limit) {
        promotions = promotions.slice(0, filters.limit)
      }

      return promotions
    } catch (error) {
      console.error("Error fetching promotions:", error)
      return []
    }
  }

  static async getPromotion(promotionId: string): Promise<any | null> {
    try {
      const docRef = doc(db, "promotions", promotionId)
      const docSnap = await getDoc(docRef)
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
    } catch (error) {
      console.error("Error fetching promotion:", error)
      return null
    }
  }

  static async createPromotion(promotionData: any): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, "promotions"), {
        ...promotionData,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating promotion:", error)
      return null
    }
  }

  static async updatePromotion(promotionId: string, data: any): Promise<boolean> {
    try {
      const docRef = doc(db, "promotions", promotionId)
      await updateDoc(docRef, {
        ...data,
        updated_at: Timestamp.now(),
      })
      return true
    } catch (error) {
      console.error("Error updating promotion:", error)
      return false
    }
  }

  static async deletePromotion(promotionId: string): Promise<boolean> {
    try {
      const docRef = doc(db, "promotions", promotionId)
      await deleteDoc(docRef)
      return true
    } catch (error) {
      console.error("Error deleting promotion:", error)
      return false
    }
  }

  static async countActivePromotions(businessId: string): Promise<number> {
    try {
      const promotions = await this.getPromotions({
        businessId,
        status: "active",
      })
      return promotions.length
    } catch (error) {
      console.error("Error counting active promotions:", error)
      return 0
    }
  }
}