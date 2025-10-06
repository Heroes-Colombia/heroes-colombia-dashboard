import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "./firebase"
import { firebaseService } from "./firebase-service"
import type { BusinessProfile, GeoPoint } from "./types"

// Helper function to read user document by UID (searches by uid field, not document ID)
const readUserById = async (userId: string) => {
  try {
    // First try by document ID (current approach)
    const docRef = doc(db, "users", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const userData = docSnap.data()
      return { exists: true, data: userData }
    }

    // Try querying by uid field
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("uid", "==", userId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data()
      return { exists: true, data: userData }
    }

    return { exists: false, data: null }
  } catch (error) {
    return { exists: false, data: null }
  }
}

export interface User {
  id: string
  email: string
  role: "business" | "admin"
  businessId?: string
  permissions?: string[]
}

export interface BusinessUser extends User {
  role: "business"
  businessId: string
  businessName: string
  plan: "gratis" | "basico" | "pro" | "enterprise"
  permissions: ("owner" | "manager" | "staff")[]
}

export interface AdminUser extends User {
  role: "admin"
  permissions: ("super_admin")[]
}

export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Get user profile from Firestore users collection using helper
    const userResult = await readUserById(firebaseUser.uid)

    if (!userResult.exists || !userResult.data) {
      throw new Error("User profile not found in Firestore")
    }

    const userData = userResult.data

    // Check if user has the required role based on permissions
    console.log(`🔑 User permissions: ${JSON.stringify(userData.permission)}`)

    if (!userData.permission?.includes("admin") && !userData.permission?.includes("business")) {
      console.log("❌ Admin access denied - missing admin permission")
      throw new Error("User found with insufficient permissions")
    }

    console.log("✅ Permission check passed")

    if (userData.permission?.includes("business")) {
      const businessUser: BusinessUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        role: "business",
        businessId: userData.businessId || firebaseUser.uid,
        businessName: userData.businessName || "Mi Empresa",
        plan: userData.plan || "gratis",
        permissions: userData.permission || ["owner"],
      }
      return businessUser
    } else {
      const adminUser: AdminUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        role: "admin",
        permissions: userData.permission || ["super_admin"],
      }
      return adminUser
    }
  } catch (error: any) {
    throw new Error(error.message || "Login failed")
  }
}

export const loginWithGoogle = async (role: "business" | "admin"): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    const firebaseUser = userCredential.user

    // Check if user profile exists
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid))

    if (!userDoc.exists()) {
      // Create new user profile for Google sign-in
      const newUserData = {
        email: firebaseUser.email,
        role: role,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      if (role === "business") {
        await setDoc(doc(db, "users", firebaseUser.uid), {
          ...newUserData,
          businessName: firebaseUser.displayName || "Mi Empresa",
          businessId: firebaseUser.uid,
          plan: "gratis",
          permission: ["business", "owner"],
          status: "pending",
        })
      } else {
        await setDoc(doc(db, "users", firebaseUser.uid), {
          ...newUserData,
          permission: ["admin", "super_admin"],
        })
      }
    }

    return await loginWithEmail(firebaseUser.email!, "")
  } catch (error: any) {
    throw new Error(error.message || "Google login failed")
  }
}

export const registerBusiness = async (
  email: string,
  password: string,
  businessData: {
    businessName: string
    nit: string
    phone: string
    category: string
    description: string
    address?: string
    ownerName?: string
  },
): Promise<BusinessUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Create business document in businesses collection
    const businessProfile: Omit<BusinessProfile, "id"> = {
      name: businessData.businessName,
      identification: businessData.nit,
      email: firebaseUser.email!,
      phone_number: businessData.phone,
      categories: [businessData.category],
      description: businessData.description,
      address: businessData.address || "",
      owner_name: businessData.ownerName || firebaseUser.email?.split("@")[0] || "Business Owner",
      owner_uid: firebaseUser.uid,

      // Default location (Bogotá center for now - should be updated with real geocoding)
      location: { latitude: 4.6097, longitude: -74.0817 },
      geo_hash: {
        geohash: "d2cbe0c0b", // Default geohash for Bogotá
        geopoint: { latitude: 4.6097, longitude: -74.0817 }
      },

      status: "pending",
      featured: false,
      reviews: [],
      plan: "gratis",
    }

    // Create business document
    const businessId = await firebaseService.createBusiness(businessProfile)

    if (!businessId) {
      throw new Error("Failed to create business profile")
    }

    // Create user profile in users collection
    const userProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      permission: "business",
      status: "active",
      owned_businesses: [businessId],
      first_name: businessData.ownerName?.split(" ")[0] || "Business",
      first_last_name: businessData.ownerName?.split(" ")[1] || "Owner",
      identification_card: businessData.nit,
      verified: false,
      rank: "Business Owner",
      phone_number: businessData.phone,
    }

    await setDoc(doc(db, "users", firebaseUser.uid), userProfile)

    const businessUser: BusinessUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      role: "business",
      businessId: businessId,
      businessName: businessData.businessName,
      plan: "gratis",
      permissions: ["owner"],
    }

    return businessUser
  } catch (error: any) {
    console.error("Registration error:", error)
    throw new Error(error.message || "Registration failed")
  }
}

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth)
  } catch (error: any) {
    throw new Error(error.message || "Logout failed")
  }
}

export const mockLogout = async (): Promise<void> => {
  // Use the Firebase logout function and wait for completion
  await logout()
}

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    throw new Error(error.message || "Password reset failed")
  }
}

export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        unsubscribe()
        resolve(null)
        return
      }

      try {
        // Retry mechanism for Firestore document retrieval
        const maxRetries = 3
        let retryCount = 0
        let userResult: { exists: boolean; data: any } = { exists: false, data: null }

        while (retryCount < maxRetries && !userResult.exists) {
          userResult = await readUserById(firebaseUser.uid)

          if (!userResult.exists) {
            retryCount++
            if (retryCount < maxRetries) {
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
            }
          }
        }

        if (userResult.exists && userResult.data) {
          const userData = userResult.data

          if (userData.role === "business" || userData.permission?.includes("business")) {
            const businessUser: BusinessUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              role: "business",
              businessId: userData.businessId || firebaseUser.uid,
              businessName: userData.businessName || "Mi Empresa",
              plan: userData.plan || "gratis",
              permissions: userData.permission || ["owner"],
            }
            unsubscribe()
            resolve(businessUser)
            return
          }

          if (userData.role === "admin" || userData.permission?.includes("admin")) {
            const adminUser: AdminUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              role: "admin",
              permissions: userData.permission || ["super_admin"],
            }
            unsubscribe()
            resolve(adminUser)
            return
          }
        }

        unsubscribe()
        resolve(null)
      } catch (error) {
        console.error("Error getting user profile:", error)
        unsubscribe()
        resolve(null)
      }
    })
  })
}

export const updateUserProfile = async (userId: string, data: any): Promise<void> => {
  try {
    const docRef = doc(db, "users", userId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date(),
    })
  } catch (error: any) {
    throw new Error(error.message || "Profile update failed")
  }
}

// Helper function to create admin user document in Firestore
export const createAdminUser = async (userId: string, email: string): Promise<void> => {
  try {
    const adminUserData = {
      email: email,
      role: "admin",
      permission: ["admin", "super_admin"],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await setDoc(doc(db, "users", userId), adminUserData)
  } catch (error: any) {
    throw new Error(error.message || "Failed to create admin user")
  }
}
