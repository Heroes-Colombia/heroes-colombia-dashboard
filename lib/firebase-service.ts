// Firebase service layer for Heroes Colombia dashboard
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
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "./firebase"
import type { BusinessCategory, BusinessProfile, GeoPoint, Advertisement } from "./types"

// Legacy Business interface - now using BusinessProfile from types.ts
// Kept for backward compatibility during migration
export interface Business extends BusinessProfile {
  // Any legacy-specific fields can be added here
}

export interface Location {
  id: string
  businessId: string
  name: string
  address: string
  city: string
  department: string
  phone: string
  manager: string
  coordinates?: { lat: number; lng: number }
  isActive: boolean
}

export interface Promotion {
  id: string
  businessId: string
  title: string
  description: string
  discount: number
  discountType: "percentage" | "fixed"
  category: string
  validFrom: Timestamp
  validTo: Timestamp
  maxRedemptions?: number
  currentRedemptions: number
  isActive: boolean
  imageUrl?: string
  terms: string
  locations: string[]
}

export interface Redemption {
  id: string
  promotionId: string
  businessId: string
  userId: string
  locationId: string
  redeemedAt: Timestamp
  amount: number
  status: "pending" | "completed" | "cancelled"
}

export interface User {
  id: string
  email: string
  name: string
  militaryId: string
  rank: string
  unit: string
  phone: string
  isVerified: boolean
  createdAt: Timestamp
}

export interface Subscription {
  id: string
  businessId: string
  plan: "gratis" | "basico" | "pro" | "enterprise"
  status: "active" | "cancelled" | "past_due"
  currentPeriodStart: Timestamp
  currentPeriodEnd: Timestamp
  cancelAtPeriodEnd: boolean
  wompiSubscriptionId?: string
}

export interface BusinessDocument {
  id: string
  businessId: string
  type: "rut" | "chamber_commerce" | "legal_representative_id" | "bank_certification"
  fileName: string
  fileUrl: string
  status: "pending" | "approved" | "rejected"
  uploadedAt: Timestamp
  reviewedAt?: Timestamp
  reviewNotes?: string
}

class FirebaseService {
  // Category operations
  async getCategories(): Promise<BusinessCategory[]> {
    try {
      // Simple query without compound filtering to avoid index requirements
      const snapshot = await getDocs(collection(db, "business_categories"))
      const categories = snapshot.docs
        .map((doc) => ({
          category_id: doc.data().category_id,
          name: doc.data().name,
          image: doc.data().image,
          status: doc.data().status,
        }))
        .filter((category) => category.status === "active") // Filter in memory
        .sort((a, b) => a.name.localeCompare(b.name)) // Sort in memory

      return categories
    } catch (error) {
      console.error("Error fetching categories:", error)
      return []
    }
  }

  async getCategory(categoryId: string): Promise<BusinessCategory | null> {
    try {
      // Get all categories and find the one we need in memory
      const snapshot = await getDocs(collection(db, "business_categories"))
      const category = snapshot.docs
        .map((doc) => ({
          category_id: doc.data().category_id,
          name: doc.data().name,
          image: doc.data().image,
          status: doc.data().status,
        }))
        .find((cat) => cat.category_id === categoryId)

      return category || null
    } catch (error) {
      console.error("Error fetching category:", error)
      return null
    }
  }

  // Business operations
  async getBusinesses(filters?: { status?: string; plan?: string; limit?: number; category?: string }): Promise<BusinessProfile[]> {
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
        const aDate = a.createdAt ? (a.createdAt as any).seconds || 0 : 0
        const bDate = b.createdAt ? (b.createdAt as any).seconds || 0 : 0
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

  async getBusiness(businessId: string): Promise<BusinessProfile | null> {
    try {
      const docRef = doc(db, "businesses", businessId)
      const docSnap = await getDoc(docRef)
      return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as BusinessProfile) : null
    } catch (error) {
      console.error("Error fetching business:", error)
      return null
    }
  }

  async createBusiness(businessData: Omit<BusinessProfile, "id">): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, "businesses"), {
        ...businessData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating business:", error)
      return null
    }
  }

  async updateBusiness(businessId: string, data: Partial<BusinessProfile>): Promise<boolean> {
    try {
      const docRef = doc(db, "businesses", businessId)
      await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() })
      return true
    } catch (error) {
      console.error("Error updating business:", error)
      return false
    }
  }

  async updateBusinessStatus(businessId: string, status: BusinessProfile["status"], notes?: string): Promise<boolean> {
    try {
      const docRef = doc(db, "businesses", businessId)
      await updateDoc(docRef, {
        status,
        verificationNotes: notes,
        updatedAt: Timestamp.now(),
      })
      return true
    } catch (error) {
      console.error("Error updating business status:", error)
      return false
    }
  }

  async getBusinessesByOwner(ownerUid: string): Promise<BusinessProfile[]> {
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

  // Advertisement/Promotion operations
  async getAdvertisements(filters?: { businessId?: string; status?: string; limit?: number }): Promise<Advertisement[]> {
    try {
      // Use simple query to avoid index requirements
      const snapshot = await getDocs(collection(db, "advertisements"))
      let advertisements = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Advertisement[]

      // Apply filters in memory
      if (filters?.businessId) {
        advertisements = advertisements.filter((ad) => ad.business_id === filters.businessId)
      }
      if (filters?.status) {
        advertisements = advertisements.filter((ad) => ad.status === filters.status)
      }

      // Sort by creation date or expiry date (newest first)
      advertisements.sort((a, b) => {
        const aDate = a.createdAt ? (a.createdAt as any).seconds || 0 : 0
        const bDate = b.createdAt ? (b.createdAt as any).seconds || 0 : 0
        return bDate - aDate
      })

      // Apply limit
      if (filters?.limit) {
        advertisements = advertisements.slice(0, filters.limit)
      }

      return advertisements
    } catch (error) {
      console.error("Error fetching advertisements:", error)
      return []
    }
  }

  async getAdvertisement(advertisementId: string): Promise<Advertisement | null> {
    try {
      const docRef = doc(db, "advertisements", advertisementId)
      const docSnap = await getDoc(docRef)
      return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Advertisement) : null
    } catch (error) {
      console.error("Error fetching advertisement:", error)
      return null
    }
  }

  async createAdvertisement(advertisementData: Omit<Advertisement, "id">): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, "advertisements"), {
        ...advertisementData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating advertisement:", error)
      return null
    }
  }

  async updateAdvertisement(advertisementId: string, data: Partial<Advertisement>): Promise<boolean> {
    try {
      const docRef = doc(db, "advertisements", advertisementId)
      await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() })
      return true
    } catch (error) {
      console.error("Error updating advertisement:", error)
      return false
    }
  }

  async updateAdvertisementStatus(advertisementId: string, status: "active" | "inactive"): Promise<boolean> {
    try {
      const docRef = doc(db, "advertisements", advertisementId)
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now(),
      })
      return true
    } catch (error) {
      console.error("Error updating advertisement status:", error)
      return false
    }
  }

  async deleteAdvertisement(advertisementId: string): Promise<boolean> {
    try {
      const docRef = doc(db, "advertisements", advertisementId)
      await deleteDoc(docRef)
      return true
    } catch (error) {
      console.error("Error deleting advertisement:", error)
      return false
    }
  }

  async getAdvertisementsByBusiness(businessId: string): Promise<Advertisement[]> {
    try {
      const snapshot = await getDocs(collection(db, "advertisements"))
      const advertisements = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Advertisement))
        .filter((ad) => ad.business_id === businessId)

      return advertisements
    } catch (error) {
      console.error("Error fetching advertisements by business:", error)
      return []
    }
  }

  // Legacy promotion methods - wrapper around advertisement methods for backward compatibility
  async getPromotions(businessId?: string, filters?: { isActive?: boolean; limit?: number }) {
    const adFilters: any = {}
    if (businessId) adFilters.businessId = businessId
    if (filters?.isActive !== undefined) adFilters.status = filters.isActive ? "active" : "inactive"
    if (filters?.limit) adFilters.limit = filters.limit

    const advertisements = await this.getAdvertisements(adFilters)

    // Convert Advertisement to legacy Promotion format
    return advertisements.map((ad) => ({
      ...ad,
      businessId: ad.business_id,
      type: "percentage" as const,
      value: ad.percentage,
      startDate: ad.createdAt || new Date(),
      endDate: ad.expired_at,
      isActive: ad.status === "active",
      currentRedemptions: 0,
      digitalCardEligible: true,
      isFeatured: false,
      createdBy: "",
    }))
  }

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

  // User operations
  async getUsers(filters?: { isVerified?: boolean; limit?: number }) {
    let q = query(collection(db, "users"), orderBy("createdAt", "desc"))

    if (filters?.isVerified !== undefined) {
      q = query(q, where("isVerified", "==", filters.isVerified))
    }
    if (filters?.limit) {
      q = query(q, limit(filters.limit))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as User)
  }

  async verifyUser(userId: string, isVerified: boolean) {
    const docRef = doc(db, "users", userId)
    await updateDoc(docRef, { isVerified, updatedAt: Timestamp.now() })
  }

  // Analytics operations
  async getAnalytics(businessId?: string, dateRange?: { start: Date; end: Date }) {
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const endDate = dateRange?.end || new Date()

    // Get redemptions for the period
    const redemptions = await this.getRedemptions(businessId, {
      startDate,
      endDate,
      limit: 1000,
    })

    // Get promotions
    const promotions = await this.getPromotions(businessId, { limit: 1000 })

    // Calculate metrics
    const totalRedemptions = redemptions.length
    const totalRevenue = redemptions.reduce((sum, r) => sum + r.amount, 0)
    const activePromotions = promotions.filter((p) => p.isActive).length
    const averageRedemptionValue = totalRedemptions > 0 ? totalRevenue / totalRedemptions : 0

    return {
      totalRedemptions,
      totalRevenue,
      activePromotions,
      averageRedemptionValue,
      redemptions,
      promotions,
    }
  }

  // File upload operations
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    return await getDownloadURL(snapshot.ref)
  }

  async deleteFile(path: string) {
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
  }

  // Document operations
  async uploadBusinessDocument(businessId: string, file: File, type: BusinessDocument["type"]): Promise<string> {
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `businesses/${businessId}/documents/${fileName}`
    const fileUrl = await this.uploadFile(file, filePath)

    const docRef = await addDoc(collection(db, "business_documents"), {
      businessId,
      type,
      fileName,
      fileUrl,
      status: "pending",
      uploadedAt: Timestamp.now(),
    })

    return docRef.id
  }

  async getBusinessDocuments(businessId: string) {
    const q = query(collection(db, "business_documents"), where("businessId", "==", businessId))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as BusinessDocument)
  }

  async updateDocumentStatus(documentId: string, status: BusinessDocument["status"], reviewNotes?: string) {
    const docRef = doc(db, "business_documents", documentId)
    await updateDoc(docRef, {
      status,
      reviewNotes,
      reviewedAt: Timestamp.now(),
    })
  }

  // Subscription operations
  async updateSubscription(businessId: string, subscriptionData: Partial<Subscription>) {
    const q = query(collection(db, "subscriptions"), where("businessId", "==", businessId))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      // Create new subscription
      await addDoc(collection(db, "subscriptions"), {
        businessId,
        ...subscriptionData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    } else {
      // Update existing subscription
      const docRef = doc(db, "subscriptions", snapshot.docs[0].id)
      await updateDoc(docRef, {
        ...subscriptionData,
        updatedAt: Timestamp.now(),
      })
    }
  }

  async getSubscription(businessId: string): Promise<Subscription | null> {
    const q = query(collection(db, "subscriptions"), where("businessId", "==", businessId))
    const snapshot = await getDocs(q)
    return snapshot.empty ? null : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Subscription)
  }
}

export const firebaseService = new FirebaseService()
