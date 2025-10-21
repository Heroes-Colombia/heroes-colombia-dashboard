import {
    collection,
    doc,
    getDocs,
    getDoc,
    updateDoc,
    Timestamp,
} from "firebase/firestore"
import { db } from "../firebase"

export class TeamMemberService {
  // Team member operations (users with business_roles)
  static async getBusinessTeamMembers(businessId: string): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, "users"))
      const teamMembers = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          business_roles: doc.data().business_roles,
          ...doc.data(),
        }))
        .filter((user) => {
          const businessRoles = user.business_roles || []
          return businessRoles.some((role: any) => role.business_id === businessId)
        })

      return teamMembers
    } catch (error) {
      console.error("Error fetching team members:", error)
      return []
    }
  }

  static async addTeamMember(businessId: string, userId: string, role: string, permissions: string[]): Promise<boolean> {
    try {
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) return false

      const userData = userSnap.data()
      const businessRoles = userData.business_roles || []

      // Check if user already has role for this business
      const existingRoleIndex = businessRoles.findIndex((r: any) => r.business_id === businessId)

      if (existingRoleIndex >= 0) {
        // Update existing role
        businessRoles[existingRoleIndex] = {
          business_id: businessId,
          role,
          permissions,
          added_at: businessRoles[existingRoleIndex].added_at,
          updated_at: Timestamp.now(),
        }
      } else {
        // Add new role
        businessRoles.push({
          business_id: businessId,
          role,
          permissions,
          added_at: Timestamp.now(),
        })
      }

      await updateDoc(userRef, {
        business_roles: businessRoles,
        updated_at: Timestamp.now(),
      })

      return true
    } catch (error) {
      console.error("Error adding team member:", error)
      return false
    }
  }

  static async removeTeamMember(businessId: string, userId: string): Promise<boolean> {
    try {
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) return false

      const userData = userSnap.data()
      const businessRoles = userData.business_roles || []

      // Remove role for this business
      const updatedRoles = businessRoles.filter((r: any) => r.business_id !== businessId)

      await updateDoc(userRef, {
        business_roles: updatedRoles,
        updated_at: Timestamp.now(),
      })

      return true
    } catch (error) {
      console.error("Error removing team member:", error)
      return false
    }
  }
}