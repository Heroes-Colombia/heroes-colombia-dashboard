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
import { BusinessService } from "./services/business-service"
import { LocationService } from "./services/location-service"
import type { FirebaseBusinessUser, FirebaseConsumerUser, BusinessType, BusinessStatus, PlanType, SubscriptionStatus } from "./types"

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

    if (userData.user_type != "admin" && userData.user_type != "business_team") {
      console.log("❌ Admin access denied - missing admin permission")
      throw new Error("User found with insufficient permissions")
    }

    console.log("✅ Permission check passed")

    if (userData.user_type == "business_team") {
      // Extract role from business_roles array (V2 schema)
      const businessRoles = userData.business_roles || []
      const userRole = businessRoles.find((role: any) =>
        role.business_id === (userData.businessId || firebaseUser.uid)
      )
      const businesDetails = await BusinessService.getBusinessByOwnerId(userData.uid)

      const businessUser: BusinessUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        role: "business",
        businessId: businesDetails?.id || firebaseUser.uid,
        businessName: businesDetails?.name || "Mi Empresa",
        plan: businesDetails?.plan || "gratis",
        permissions: userRole ? [userRole.role as ("owner" | "manager" | "staff")] : ["owner"],
      }
      return businessUser
    } else {
      const adminUser: AdminUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        role: "admin",
        permissions: Array.isArray(userData.permission) ? userData.permission : ["super_admin"],
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
          permission: "business", // V1 compatibility
          user_type: "business_team", // V2 schema
          business_roles: [], // V2 schema - empty until business created
          status: "pending",
        })
      } else {
        await setDoc(doc(db, "users", firebaseUser.uid), {
          ...newUserData,
          permission: "admin", // V1 compatibility
          user_type: "admin", // V2 schema
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
    plan?: string
  },
): Promise<BusinessUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Create business document in businesses collection
    // Use snake_case fields to match Firebase schema
    const businessDataFirebase = {
      name: businessData.businessName,
      identification: businessData.nit,
      email: firebaseUser.email!,
      phone_number: businessData.phone,
      categories: [businessData.category], // String array of category IDs
      description: businessData.description,
      address: businessData.address || "",
      owner_name: businessData.ownerName || firebaseUser.email?.split("@")[0] || "Business Owner",
      owner_uid: firebaseUser.uid,

      // Type & Categories
      type: (businessData.address ? "physical" : "online") as BusinessType,

      // Default location (Bogotá center for now - should be updated with real geocoding)
      location: { latitude: 4.6097, longitude: -74.0817 },
      geo_hash: {
        geohash: "d2cbe0c0b", // Default geohash for Bogotá
        geopoint: { latitude: 4.6097, longitude: -74.0817 }
      },

      status: "pending" as BusinessStatus,
      featured: false,
      plan: businessData.plan as PlanType,
      subscription_status: "trial" as SubscriptionStatus,
    }

    // Create business document
    const businessId = await BusinessService.createBusiness(businessDataFirebase)

    if (!businessId) {
      throw new Error("Failed to create business profile")
    }

    // Create user profile in users collection (Schema V2)
    const userProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,

      // V1 field (keep for backward compatibility)
      permission: "business",

      // V2 fields (new schema)
      user_type: "business_team",
      business_roles: [
        {
          business_id: businessId,
          role: "owner",
          permissions: ["manage_all"],
          added_at: new Date()
        }
      ],

      status: "active",
      owned_businesses: [businessId],
      first_name: businessData.ownerName?.split(" ")[0] || "Business",
      first_last_name: businessData.ownerName?.split(" ")[1] || "Owner",
      identification_card: businessData.nit,
      verified: false,
      rank: "Business Owner",
      phone_number: businessData.phone,
      created_at: new Date(),
      updated_at: new Date()
    }

    await setDoc(doc(db, "users", firebaseUser.uid), userProfile)

    // Create primary location in subcollection (Schema V2)
    await LocationService.createLocation(businessId, {
      name: `${businessData.businessName} - Sede Principal`,
      is_primary: true,
      type: businessData.address ? "physical" : "online",
      phone: businessData.phone || null,
      email: firebaseUser.email || null,
      website: null,
      address: businessData.address || null,
      location: businessData.address ? { latitude: 4.6097, longitude: -74.0817 } : null,
      geo_hash: businessData.address ? {
        geohash: "d2cbe0c0b",
        geopoint: { latitude: 4.6097, longitude: -74.0817 }
      } : null,
      business_hours: null,
      delivery_zones: null,
      delivery_type: null,
      whatsapp: null,
      status: "active"
    })

    const businessUser: BusinessUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      role: "business",
      businessId: businessId,
      businessName: businessData.businessName,
      plan: businessData.plan as PlanType || "gratis",
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

          // Check both V1 (role/permission) and V2 (user_type) fields for backward compatibility
          if (userData.role === "business" || userData.user_type === "business_team") {
            // Extract role from business_roles array (V2 schema)
            const businessRoles = userData.business_roles || []
            const userRole = businessRoles.find((role: any) =>
              role.business_id === (userData.businessId || firebaseUser.uid)
            )
            const businesDetails = await BusinessService.getBusinessByOwnerId(userData.uid)

            const businessUser: BusinessUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              role: "business",
              businessId: businesDetails?.id || firebaseUser.uid,
              businessName: businesDetails?.name || "Mi Empresa",
              plan: businesDetails?.plan || "gratis",
              permissions: userRole ? [userRole.role as ("owner" | "manager" | "staff")] : ["owner"],
            }
            unsubscribe()
            resolve(businessUser)
            return
          }

          if (userData.role === "admin" || userData.user_type === "admin") {
            const adminUser: AdminUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email!,
              role: "admin",
              permissions: Array.isArray(userData.permission) ? userData.permission : ["super_admin"],
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
      uid: userId,
      email: email,

      // V1 field (keep for backward compatibility)
      permission: ["admin", "super_admin"],
      role: "admin",

      // V2 schema
      user_type: "admin",

      status: "active",
      verified: true,
      created_at: new Date(),
      updated_at: new Date(),
    }

    await setDoc(doc(db, "users", userId), adminUserData)
  } catch (error: any) {
    throw new Error(error.message || "Failed to create admin user")
  }
}
