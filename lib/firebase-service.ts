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
  plan: "basico" | "pro" | "enterprise"
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
    const q = query(collection(db, "subscriptions"), where("business_id", "==", businessId))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      // Create new subscription
      await addDoc(collection(db, "subscriptions"), {
        business_id: businessId,
        ...subscriptionData,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      })
    } else {
      // Update existing subscription
      const docRef = doc(db, "subscriptions", snapshot.docs[0].id)
      await updateDoc(docRef, {
        ...subscriptionData,
        updated_at: Timestamp.now(),
      })
    }
  }

  async getSubscription(businessId: string): Promise<Subscription | null> {
    const q = query(collection(db, "subscriptions"), where("business_id", "==", businessId))
    const snapshot = await getDocs(q)
    return snapshot.empty ? null : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Subscription)
  }
}

export const firebaseService = new FirebaseService()
