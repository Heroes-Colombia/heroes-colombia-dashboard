import {
    collection,
    doc,
    getDocs,
    getDoc,
    where,
    query,
    updateDoc,
    Timestamp,
} from "firebase/firestore"
import { db } from "../firebase"
import {
  BusinessPermission,
  DEFAULT_PERMISSIONS,
  TeamPermissions,
} from "../types"

export class TeamMemberService {
  // Team member operations (users with business_roles)
  static async getBusinessTeamMembers(businessId: string): Promise<any[]> {
    try {
      const q = query(collection(db, "users"), where("status", "==", "active"))
      const snapshot = await getDocs(q)
      const teamMembers = snapshot.docs
        .map((doc) => {
          const userData = doc.data()
          const businessRoles = userData.business_roles || []
          const userBusinessRole = businessRoles.find(
            (role: any) => role.business_id === businessId
          )

          let permissions: TeamPermissions = DEFAULT_PERMISSIONS[BusinessPermission.staff]
          if (userBusinessRole) {
            permissions = userBusinessRole.permissions || DEFAULT_PERMISSIONS[userBusinessRole.role as BusinessPermission] || DEFAULT_PERMISSIONS[BusinessPermission.staff]
          }

          return {
            id: doc.id,
            business_roles: businessRoles,
            permissions: permissions, // Assign permissions here
            ...userData,
          }
        })
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

  static async addTeamMember(
    businessId: string,
    userId: string,
    role: BusinessPermission,
    permissions?: TeamPermissions
  ): Promise<boolean> {
    try {
      const userRef = doc(db, "users", userId)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) return false

      const userData = userSnap.data()
      const businessRoles = userData.business_roles || []

      // Determine permissions to use
      const permissionsToSet = permissions || DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS[BusinessPermission.staff]

      // Check if user already has role for this business
      const existingRoleIndex = businessRoles.findIndex((r: any) => r.business_id === businessId)

      if (existingRoleIndex >= 0) {
        // Update existing role
        businessRoles[existingRoleIndex] = {
          business_id: businessId,
          role,
          permissions: permissionsToSet,
          added_at: businessRoles[existingRoleIndex].added_at,
          updated_at: Timestamp.now(),
        }
      } else {
        // Add new role
        businessRoles.push({
          business_id: businessId,
          role,
          permissions: permissionsToSet,
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

      await updateDoc(userRef, {
        status: "inactive",
        updated_at: Timestamp.now(),
      })

      return true
    } catch (error) {
      console.error("Error removing team member:", error)
      return false
    }
  }
}