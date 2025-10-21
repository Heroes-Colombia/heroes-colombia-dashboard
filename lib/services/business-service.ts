import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    limit,
    Timestamp,
  } from "firebase/firestore"
import { db } from "../firebase"
import type { BusinessProfile } from "../types"

export class BusinessService {

    // Business operations
    static async getBusinesses(filters?: { status?: string; plan?: string; limit?: number; category?: string }): Promise<BusinessProfile[]> {
      try {
        // Use simple query to avoid index requirements
        const snapshot = await getDocs(collection(db, "businesses"))
        let businesses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BusinessProfile[]
  
        // Apply filters in memory
        if (filters?.status) {
          businesses = businesses.filter((business) => business.status === filters.status)
        }
        if (filters?.plan) {
          businesses = businesses.filter((business) => business.plan === filters.plan)
        }
        if (filters?.category) {
          businesses = businesses.filter((business) =>
            business.categories?.includes(filters.category!)
          )
        }
  
        // Sort by creation date (newest first)
        businesses.sort((a, b) => {
          const aDate = a.created_at ? (a.created_at as any).seconds || 0 : 0
          const bDate = b.created_at ? (b.created_at as any).seconds || 0 : 0
          return bDate - aDate
        })
  
        // Apply limit
        if (filters?.limit) {
          businesses = businesses.slice(0, filters.limit)
        }
  
        return businesses
      } catch (error) {
        console.error("Error fetching businesses:", error)
        return []
      }
    }
  
    static async getBusiness(businessId: string): Promise<BusinessProfile | null> {
      try {
        const docRef = doc(db, "businesses", businessId)
        const docSnap = await getDoc(docRef)
        return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as BusinessProfile) : null
      } catch (error) {
        console.error("Error fetching business:", error)
        return null
      }
    }
  
    static async getBusinessByOwnerId(ownerUid: string): Promise<BusinessProfile | null> {
      try {
        const q = query(collection(db, "businesses"), where("owner_uid", "==", ownerUid), limit(1))
        const snapshot = await getDocs(q)
  
        if (snapshot.empty) {
          return null
        }
  
        const doc = snapshot.docs[0]
        return { id: doc.id, ...doc.data() } as BusinessProfile
      } catch (error) {
        console.error("Error fetching business by owner:", error)
        return null
      }
    }
  
    static async createBusiness(businessData: Omit<BusinessProfile, "id">): Promise<string | null> {
      try {
        const docRef = await addDoc(collection(db, "businesses"), {
          ...businessData,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        })
        return docRef.id
      } catch (error) {
        console.error("Error creating business:", error)
        return null
      }
    }
  
    static async updateBusiness(businessId: string, data: Partial<BusinessProfile>): Promise<boolean> {
      try {
        const docRef = doc(db, "businesses", businessId)
        await updateDoc(docRef, { ...data, updated_at: Timestamp.now() })
        return true
      } catch (error) {
        console.error("Error updating business:", error)
        return false
      }
    }
  
    static async updateBusinessStatus(businessId: string, status: BusinessProfile["status"], notes?: string): Promise<boolean> {
      try {
        const docRef = doc(db, "businesses", businessId)
        await updateDoc(docRef, {
          status,
          verification_notes: notes,
          updated_at: Timestamp.now(),
        })
        return true
      } catch (error) {
        console.error("Error updating business status:", error)
        return false
      }
    }
  
    static async getBusinessesByOwner(ownerUid: string): Promise<BusinessProfile[]> {
      try {
        const snapshot = await getDocs(collection(db, "businesses"))
        const businesses = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as BusinessProfile))
          .filter((business) => business.owner_uid === ownerUid)
  
        return businesses
      } catch (error) {
        console.error("Error fetching businesses by owner:", error)
        return []
      }
    }    
}