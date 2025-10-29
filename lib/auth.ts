import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updatePassword,
  deleteUser,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "./firebase"
import { BusinessService } from "./services/business-service"
import { LocationService } from "./services/location-service"
import type { BusinessType, BusinessStatus, PlanType, SubscriptionStatus } from "./types"

// Cache configuration
const USER_CACHE_KEY = 'heroes_user_cache'
const SESSION_START_KEY = 'heroes_session_start'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000      // 7 days - refresh cache
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000   // 30 days - force logout

// Cache utilities
const getCachedUser = (): CustomerUser | null => {
  if (typeof window === 'undefined') return null

  try {
    const cached = localStorage.getItem(USER_CACHE_KEY)
    if (!cached) return null

    const { user, timestamp } = JSON.parse(cached)

    // Check if cache has expired (7 days)
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(USER_CACHE_KEY)
      return null
    }

    return user
  } catch (error) {
    console.error("Error reading cached user:", error)
    return null
  }
}

const setCachedUser = (user: CustomerUser | null): void => {
  if (typeof window === 'undefined') return

  try {
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify({
        user,
        timestamp: Date.now()
      }))
    } else {
      localStorage.removeItem(USER_CACHE_KEY)
    }
  } catch (error) {
    console.error("Error caching user:", error)
  }
}

const checkSessionExpiry = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false

  try {
    const sessionStart = localStorage.getItem(SESSION_START_KEY)

    if (sessionStart && Date.now() - parseInt(sessionStart) > SESSION_DURATION) {
      console.log("⏰ Session expired after 30 days - forcing logout")
      await logout()
      return true // Session expired
    }

    return false // Session valid
  } catch (error) {
    console.error("Error checking session expiry:", error)
    return false
  }
}

const setSessionStart = (): void => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(SESSION_START_KEY, Date.now().toString())
  } catch (error) {
    console.error("Error setting session start:", error)
  }
}

const clearSession = (): void => {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(USER_CACHE_KEY)
    localStorage.removeItem(SESSION_START_KEY)
  } catch (error) {
    console.error("Error clearing session:", error)
  }
}

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

export interface CustomerUser {
  id: string
  email: string
  name?: string
  role: "business" | "admin"
  businessId?: string
  permissions?: string[]
}

export interface BusinessUser extends CustomerUser {
  role: "business"
  businessId: string
  businessName: string
  businessIdentification?: string
  businessPhone?: string
  businessWebsite?: string
  businessDescription?: string
  businessAddress?: string
  plan: "gratis" | "basico" | "pro" | "enterprise"
  permissions: ("owner" | "manager" | "staff")[]
}

export interface AdminUser extends CustomerUser {
  role: "admin"
  permissions: ("super_admin")[]
}

// Shared helper to fetch user from Firestore and construct User object
const fetchUserFromFirestore = async (firebaseUserId: string, firebaseUserEmail: string): Promise<CustomerUser | null> => {
  try {
    // Retry mechanism for Firestore document retrieval
    const maxRetries = 3
    let retryCount = 0
    let userResult: { exists: boolean; data: any } = { exists: false, data: null }

    while (retryCount < maxRetries && !userResult.exists) {
      userResult = await readUserById(firebaseUserId)

      if (!userResult.exists) {
        retryCount++
        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 500 * retryCount))
        }
      }
    }

    if (!userResult.exists || !userResult.data) {
      return null
    }

    const userData = userResult.data

    // Check both V1 (role/permission) and V2 (user_type) fields for backward compatibility
    if (userData.user_type === "business_team" || userData.role === "business") {
      // Extract role from business_roles array (V2 schema)
      const businessRoles = userData.business_roles || []
      const userRole = businessRoles.find((role: any) =>
        role.business_id === (userData.businessId || firebaseUserId)
      )

      let businesDetails = await BusinessService.getBusinessByOwnerId(userData.uid)

      if (!businesDetails) {
        businesDetails = await BusinessService.getBusiness(userData.owned_businesses?.[0])
        if (!businesDetails) {
          throw new Error("El usuario no pertenece a ningún negocio activo en Heroes")
        }
      }

      const businessUser: BusinessUser = {
        id: firebaseUserId,
        email: firebaseUserEmail,
        role: "business",
        name: userData.first_last_name,
        businessId: businesDetails.id || firebaseUserId,
        businessName: businesDetails.name || "Mi Empresa",
        businessIdentification: businesDetails.identification || "",
        businessPhone: businesDetails.phone_number || "",
        businessWebsite: businesDetails.website || "",
        businessDescription: businesDetails.description || "",
        businessAddress: businesDetails.address || "",
        plan: businesDetails.plan || "gratis",
        permissions: userRole ? [userRole.role as ("owner" | "manager" | "staff")] : ["owner"],
      }

      return businessUser
    }

    if (userData.user_type === "admin" || userData.role === "admin") {
      const adminUser: AdminUser = {
        id: firebaseUserId,
        email: firebaseUserEmail,
        role: "admin",
        permissions: Array.isArray(userData.permission) ? userData.permission : ["super_admin"],
      }

      return adminUser
    }

    return null
  } catch (error) {
    console.error("Error fetching user from Firestore:", error)
    throw error
  }
}

export const loginWithEmail = async (email: string, password: string): Promise<CustomerUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Quick permission check before full user fetch
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

    // Fetch full user profile using shared helper
    const user = await fetchUserFromFirestore(firebaseUser.uid, firebaseUser.email!)

    if (!user) {
      throw new Error("Failed to fetch user profile")
    }

    // Cache user and start session tracking
    setCachedUser(user)
    setSessionStart()

    console.log("✅ User cached successfully")

    return user
  } catch (error: any) {
    throw new Error(error.message || "Login failed")
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
    type?: string
  },
): Promise<BusinessUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    const businessDataFirebase = {
      name: businessData.businessName,
      identification: businessData.nit,
      email: firebaseUser.email!,
      phone_number: businessData.phone,
      categories: [businessData.category],
      description: businessData.description,
      address: businessData.address || "",
      owner_name: businessData.ownerName || "Business Owner",
      owner_uid: firebaseUser.uid,

      // Type & Categories
      type: businessData.type as BusinessType,

      // Default location (Bogotá center for now - should be updated with real geocoding)
      location: { latitude: 4.6097, longitude: -74.0817 },
      geo_hash: {
        geohash: "d2cbe0c0b", // Default geohash for Bogotá
        geopoint: { latitude: 4.6097, longitude: -74.0817 }
      },

      status: "pending" as BusinessStatus,
      featured: false,
      plan: businessData.plan as PlanType || "enterprise",
      subscription_status: "trial" as SubscriptionStatus,
    }

    // Create business document
    const businessId = await BusinessService.createBusiness(businessDataFirebase)

    if (!businessId) {
      throw new Error("Error al registrar la empresa")
    }

    // Create user profile in users collection (Schema V2)
    const userProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,

      permission: "business",

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
      verified: false,
      rank: "Business Owner",
      created_at: new Date(),
      updated_at: new Date()
    }

    await setDoc(doc(db, "users", firebaseUser.uid), userProfile)

    // Create primary location in subcollection (Schema V2)
    await LocationService.createLocation(businessId, {
      name: `${businessData.businessName} - Sede Principal`,
      is_primary: true,
      type: businessData.type,
      phone: businessData.phone || null,
      email: null,
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
      businessIdentification: businessData.nit,
      businessPhone: businessData.phone,
      businessDescription: businessData.description,
      plan: businessData.plan as PlanType || "enterprise",
      permissions: ["owner"],
    }

    return businessUser
  } catch (error: any) {
    console.error("Registration error:", error)
    throw new Error(error.message || "Error al registrar la empresa")
  }
}

export const logout = async (): Promise<void> => {
  try {
    // Clear cache and session before signing out
    clearSession()
    console.log("✅ Session and cache cleared")

    await signOut(auth)
  } catch (error: any) {
    throw new Error(error.message || "Logout failed")
  }
}

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email)
  } catch (error: any) {
    throw new Error(error.message || "Password reset failed")
  }
}

export const deleteUserAccount = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("No user is currently signed in")
    }

    // Delete user from Firebase Auth
    await deleteUser(currentUser)

    // Clear session and cache
    clearSession()
  } catch (error: any) {
    throw new Error(error.message || "Account deletion failed")
  }
}

export const updateUserPassword = async (newPassword: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser
    if (!currentUser) {
      throw new Error("Ningun usuario se encuentra logeado")
    }
    await updatePassword(currentUser, newPassword)
  } catch (error: any) {
    throw new Error(error.message || "Error al actualizar la contraseña")
  }
}

export const getCurrentUser = (): Promise<CustomerUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        unsubscribe()
        resolve(null)
        return
      }

      try {
        // Check if session has expired (30 days)
        const sessionExpired = await checkSessionExpiry()
        if (sessionExpired) {
          unsubscribe()
          resolve(null)
          return
        }

        // Try cache first (7-day cache)
        const cachedUser = getCachedUser()
        if (cachedUser) {
          console.log("✅ User loaded from cache")
          unsubscribe()
          resolve(cachedUser)
          return
        }

        console.log("📡 Cache miss - fetching user from Firestore")

        // Cache miss or expired - fetch from Firestore
        const user = await fetchUserFromFirestore(firebaseUser.uid, firebaseUser.email!)

        if (user) {
          // Cache the fresh user data
          setCachedUser(user)
          console.log("✅ User fetched and cached")
        }

        unsubscribe()
        resolve(user)
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

// Helper to refresh cached user data after business updates
export const refreshUserCache = async (): Promise<CustomerUser | null> => {
  try {
    const firebaseUser = auth.currentUser

    if (!firebaseUser) {
      console.log("⚠️ No authenticated user to refresh")
      return null
    }

    console.log("🔄 Refreshing user cache after business data update")

    // Fetch fresh data from Firestore
    const user = await fetchUserFromFirestore(firebaseUser.uid, firebaseUser.email!)

    if (user) {
      // Update cache with fresh data
      setCachedUser(user)
      console.log("✅ User cache refreshed successfully")
    }

    return user
  } catch (error) {
    console.error("Error refreshing user cache:", error)
    return null
  }
}
