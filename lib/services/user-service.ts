import {
    collection,
    doc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    limit,
    Timestamp,
} from "firebase/firestore"
import { db } from "../firebase"
import { FirebaseConsumerUser } from "../types";

export class UserService {
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
      return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }) as FirebaseConsumerUser)
    }
  
    async verifyUser(userId: string, isVerified: boolean) {
      const docRef = doc(db, "users", userId)
      await updateDoc(docRef, { verified: isVerified, updated_at: Timestamp.now() })
    }    
}