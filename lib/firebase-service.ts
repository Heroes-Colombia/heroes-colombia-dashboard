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

// Types based on Heroes Colombia data structure
export interface Business {
  id: string
  name: string
  email: string
  phone: string
  website?: string
  description: string
  category: string
  nit: string
  plan: "gratis" | "basico" | "pro" | "enterprise"
  status: "pending" | "approved" | "rejected" | "suspended"
  createdAt: Timestamp
  updatedAt: Timestamp
  locations: Location[]
  documents: BusinessDocument[]
  subscription: Subscription
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
  // Business operations
  async getBusinesses(filters?: { status?: string; plan?: string; limit?: number }) {
    let q = query(collection(db, "businesses"), orderBy("createdAt", "desc"))

    if (filters?.status) {
      q = query(q, where("status", "==", filters.status))
    }
    if (filters?.plan) {
      q = query(q, where("plan", "==", filters.plan))
    }
    if (filters?.limit) {
      q = query(q, limit(filters.limit))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Business)
  }

  async getBusiness(businessId: string): Promise<Business | null> {
    const docRef = doc(db, "businesses", businessId)
    const docSnap = await getDoc(docRef)
    return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Business) : null
  }

  async updateBusiness(businessId: string, data: Partial<Business>) {
    const docRef = doc(db, "businesses", businessId)
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() })
  }

  async updateBusinessStatus(businessId: string, status: Business["status"], notes?: string) {
    const docRef = doc(db, "businesses", businessId)
    await updateDoc(docRef, {
      status,
      reviewNotes: notes,
      reviewedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  }

  // Promotion operations
  async getPromotions(businessId?: string, filters?: { isActive?: boolean; limit?: number }) {
    let q = query(collection(db, "promotions"), orderBy("createdAt", "desc"))

    if (businessId) {
      q = query(q, where("businessId", "==", businessId))
    }
    if (filters?.isActive !== undefined) {
      q = query(q, where("isActive", "==", filters.isActive))
    }
    if (filters?.limit) {
      q = query(q, limit(filters.limit))
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Promotion)
  }

  async createPromotion(promotion: Omit<Promotion, "id" | "currentRedemptions">) {
    const docRef = await addDoc(collection(db, "promotions"), {
      ...promotion,
      currentRedemptions: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return docRef.id
  }

  async updatePromotion(promotionId: string, data: Partial<Promotion>) {
    const docRef = doc(db, "promotions", promotionId)
    await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() })
  }

  async deletePromotion(promotionId: string) {
    const docRef = doc(db, "promotions", promotionId)
    await deleteDoc(docRef)
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
