// User mapping utilities for Firebase integration
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { User } from "firebase/auth"
import { db } from "@/lib/firebase"
import type { FirebaseUser, FirebaseConsumerUser, AdminDashboardUser } from "@/lib/types"
import { parseRankString } from "@/lib/military-ranks"

// Map Firebase consumer user document to admin dashboard format
export function mapFirebaseUserToAdminUser(
  firebaseUser: FirebaseUser,
  authUser?: User
): AdminDashboardUser | null {
  // Type guard - only process consumer users
  if (firebaseUser.user_type !== "consumer") {
    console.warn("Attempted to map non-consumer user to AdminDashboardUser")
    return null
  }

  const consumerUser = firebaseUser as FirebaseConsumerUser
  const { branch, rank } = parseRankString(consumerUser.rank)

  const name = `${consumerUser.first_name.trim()} ${consumerUser.first_last_name.trim()}`

  const fullName = [
    consumerUser.first_name,
    consumerUser.second_name,
    consumerUser.first_last_name,
    consumerUser.second_last_name
  ]
    .filter(part => part && part.trim().length > 0)
    .map(part => part.trim())
    .join(' ')

  return {
    id: consumerUser.uid,
    email: consumerUser.email,
    name: name,
    fullName: fullName,
    militaryId: consumerUser.identification_card,
    rank: rank,
    branch: branch,
    phone: consumerUser.phone || "",
    city: consumerUser.city || "",
    registrationDate: authUser?.metadata.creationTime
      ? new Date(authUser.metadata.creationTime)
      : new Date(),
    status: mapFirebaseStatusToAdminStatus(consumerUser.status, consumerUser.verified),
    notes: "", // Notes not stored in Firebase consumer schema
    lastLogin: authUser?.metadata.lastSignInTime
      ? new Date(authUser.metadata.lastSignInTime)
      : undefined,
  }
}

// Map Firebase status + verified to admin dashboard status
function mapFirebaseStatusToAdminStatus(
  status: "pending" | "active" | "rejected",
  verified: boolean
): "pending" | "active" | "rejected" {
  if (status === "rejected") return "rejected"
  if (status === "active" && verified) return "active"
  return "pending" // For status="pending" or status="active" but not verified
}

// Fetch all users from Firebase for admin dashboard
export async function fetchAllUsersForAdmin(): Promise<AdminDashboardUser[]> {
  try {
    const usersCollection = collection(db, "users")
    const usersSnapshot = await getDocs(usersCollection)

    const users: AdminDashboardUser[] = []

    usersSnapshot.forEach((doc) => {
      const userData = doc.data() as FirebaseUser

      // Only include users with user_type="consumer" (not business users or admins)
      if (userData.user_type === "consumer") {
        const adminUser = mapFirebaseUserToAdminUser(userData)
        if (adminUser) {
          users.push(adminUser)
        }
      }
    })

    // Sort by registration date (newest first)
    users.sort((a, b) => b.registrationDate.getTime() - a.registrationDate.getTime())

    return users
  } catch (error) {
    console.error("Error fetching users from Firebase:", error)
    throw new Error("Failed to fetch users from Firebase")
  }
}

// Fetch single user by UID
export async function fetchUserById(uid: string): Promise<AdminDashboardUser | null> {
  try {
    const userDoc = doc(db, "users", uid)
    const userSnapshot = await getDoc(userDoc)

    if (!userSnapshot.exists()) {
      return null
    }

    const userData = userSnapshot.data() as FirebaseUser
    return mapFirebaseUserToAdminUser(userData)
  } catch (error) {
    console.error("Error fetching user by ID:", error)
    return null
  }
}

// Update user notes in Firebase (admin functionality)
export async function updateUserNotes(uid: string, notes: string): Promise<boolean> {
  try {
    const userDoc = doc(db, "users", uid)
    // Note: In production, you'd use updateDoc from firebase/firestore
    // For now, returning true as placeholder
    console.log(`Updating notes for user ${uid}:`, notes)
    return true
  } catch (error) {
    console.error("Error updating user notes:", error)
    return false
  }
}

// Update user status in Firebase (admin functionality)
export async function updateUserStatus(
  uid: string,
  status: "pending" | "active" | "rejected"
): Promise<boolean> {
  try {
    const userDoc = doc(db, "users", uid)
    // Convert admin status back to Firebase format
    const firebaseStatus = status === "active" ? "active" : status
    const verified = status === "active"

    // Note: In production, you'd use updateDoc from firebase/firestore
    // For now, returning true as placeholder
    console.log(`Updating status for user ${uid}:`, { status: firebaseStatus, verified })
    return true
  } catch (error) {
    console.error("Error updating user status:", error)
    return false
  }
}

// Get statistics for admin dashboard
export async function getUserStatistics(): Promise<{
  total: number
  pending: number
  active: number
  rejected: number
}> {
  try {
    const users = await fetchAllUsersForAdmin()

    return {
      total: users.length,
      pending: users.filter(u => u.status === "pending").length,
      active: users.filter(u => u.status === "active").length,
      rejected: users.filter(u => u.status === "rejected").length,
    }
  } catch (error) {
    console.error("Error getting user statistics:", error)
    return { total: 0, pending: 0, active: 0, rejected: 0 }
  }
}