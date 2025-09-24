import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { auth, db } from "./firebase"

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
  permissions: "super_admin"[]
}

export const loginWithEmail = async (email: string, password: string, role: "business" | "admin"): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, `${role}s`, firebaseUser.uid))

    if (!userDoc.exists()) {
      throw new Error("User profile not found")
    }

    const userData = userDoc.data()

    if (role === "business") {
      const businessUser: BusinessUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        role: "business",
        businessId: userData.businessId,
        businessName: userData.businessName,
        plan: userData.plan || "gratis",
        permissions: userData.permissions || ["owner"],
      }
      return businessUser
    } else {
      const adminUser: AdminUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        role: "admin",
        permissions: userData.permissions || ["super_admin"],
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
    const userDoc = await getDoc(doc(db, `${role}s`, firebaseUser.uid))

    if (!userDoc.exists()) {
      // Create new user profile for Google sign-in
      const newUserData = {
        email: firebaseUser.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      if (role === "business") {
        await setDoc(doc(db, "businesses", firebaseUser.uid), {
          ...newUserData,
          businessName: firebaseUser.displayName || "Mi Empresa",
          plan: "gratis",
          permissions: ["owner"],
          status: "pending",
        })
      } else {
        await setDoc(doc(db, "admins", firebaseUser.uid), {
          ...newUserData,
          permissions: ["super_admin"],
        })
      }
    }

    return await loginWithEmail(firebaseUser.email!, "", role)
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
  },
): Promise<BusinessUser> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Create business profile in Firestore
    const businessProfile = {
      email: firebaseUser.email,
      businessName: businessData.businessName,
      nit: businessData.nit,
      phone: businessData.phone,
      category: businessData.category,
      description: businessData.description,
      plan: "gratis",
      status: "pending",
      permissions: ["owner"],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await setDoc(doc(db, "businesses", firebaseUser.uid), businessProfile)

    const businessUser: BusinessUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      role: "business",
      businessId: firebaseUser.uid,
      businessName: businessData.businessName,
      plan: "gratis",
      permissions: ["owner"],
    }

    return businessUser
  } catch (error: any) {
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

export const mockLogout = (role: "business" | "admin") => {
  // Use the Firebase logout function
  logout()
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
      unsubscribe()

      if (!firebaseUser) {
        resolve(null)
        return
      }

      try {
        // Try business first
        const businessDoc = await getDoc(doc(db, "businesses", firebaseUser.uid))
        if (businessDoc.exists()) {
          const userData = businessDoc.data()
          const businessUser: BusinessUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            role: "business",
            businessId: firebaseUser.uid,
            businessName: userData.businessName,
            plan: userData.plan || "gratis",
            permissions: userData.permissions || ["owner"],
          }
          resolve(businessUser)
          return
        }

        // Try admin
        const adminDoc = await getDoc(doc(db, "admins", firebaseUser.uid))
        if (adminDoc.exists()) {
          const userData = adminDoc.data()
          const adminUser: AdminUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            role: "admin",
            permissions: userData.permissions || ["super_admin"],
          }
          resolve(adminUser)
          return
        }

        resolve(null)
      } catch (error) {
        console.error("Error getting user profile:", error)
        resolve(null)
      }
    })
  })
}

export const updateUserProfile = async (userId: string, role: "business" | "admin", data: any): Promise<void> => {
  try {
    const docRef = doc(db, `${role}s`, userId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date(),
    })
  } catch (error: any) {
    throw new Error(error.message || "Profile update failed")
  }
}
