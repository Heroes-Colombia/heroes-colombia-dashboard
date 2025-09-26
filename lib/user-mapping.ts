// User mapping utilities for Firebase integration
import { collection, getDocs, doc, getDoc } from "firebase/firestore"
import { User } from "firebase/auth"
import { db } from "@/lib/firebase"
import type { FirebaseUser, AdminDashboardUser } from "@/lib/types"
import { parseRankString } from "@/lib/military-ranks"

// Map Firebase user document to admin dashboard format
export function mapFirebaseUserToAdminUser(
  firebaseUser: FirebaseUser,
  authUser?: User
): AdminDashboardUser {
  const { branch, rank } = parseRankString(firebaseUser.rank)

  const name = `${firebaseUser.first_name.trim()} ${firebaseUser.first_last_name.trim()}`

  const fullName = [
    firebaseUser.first_name,
    firebaseUser.second_name,
    firebaseUser.first_last_name,
    firebaseUser.second_last_name
  ]
    .filter(part => part && part.trim().length > 0)
    .map(part => part.trim())
    .join(' ')

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    name: name,
    fullName: fullName,
    militaryId: firebaseUser.identification_card,
    rank: rank,
    branch: branch,
    phone: firebaseUser.phone,
    city: firebaseUser.city,
    registrationDate: authUser?.metadata.creationTime
      ? new Date(authUser.metadata.creationTime)
      : new Date(),
    status: mapFirebaseStatusToAdminStatus(firebaseUser.status, firebaseUser.verified),
    notes: firebaseUser.notes || "",
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

      // Only include users with permission="user" (not business users or other admins)
      if (userData.permission === "user") {
        const adminUser = mapFirebaseUserToAdminUser(userData)
        users.push(adminUser)
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