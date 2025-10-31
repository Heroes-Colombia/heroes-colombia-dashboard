import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, doc, query, where, getDocs, getDoc, Timestamp } from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"
import { BusinessPermission, TeamPermissions } from "@/lib/types"
import { Verified } from "lucide-react"

export class InvitationService {
  /**
   * Create business team invitation
   */
  static async createBusinessTeamInvitation(params: {
    businessId: string
    businessName: string
    invitedEmail: string
    inviterUid?: string
    inviterEmail: string
    inviterName: string
    role: BusinessPermission
    permissions: TeamPermissions
  }) {
    const invitationToken = uuidv4() // Secure random token

    const invitationData = {
      invitation_type: "business_team",
      invited_email: params.invitedEmail,
      status: "pending",

      sender_uid: params.inviterUid,
      sender_email: params.inviterEmail,
      sender_name: params.inviterName,

      business_id: params.businessId,
      business_name: params.businessName,
      role: params.role,
      permissions: params.permissions,

      invitation_token: invitationToken,

      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    }

    const docRef = await addDoc(collection(db, "invitations"), invitationData)

    return {
      id: docRef.id,
      invitationToken,
      ...invitationData,
    }
  }

  /**
   * Get pending business invitations for a business
   */
  static async getPendingBusinessInvitations(businessId: string) {
    const q = query(
      collection(db, "invitations"),
      where("business_id", "==", businessId),
      where("invitation_type", "==", "business_team"),
      where("status", "==", "pending")
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  /**
   * Get invitation by token
   */
  static async getInvitationByToken(token: string) {
    const q = query(
      collection(db, "invitations"),
      where("invitation_token", "==", token),
      where("status", "==", "pending")
    )

    const snapshot = await getDocs(q)
    if (snapshot.empty) {
      throw new Error("Invitation not found or already used")
    }

    const invitationDoc = snapshot.docs[0]
    return {
      id: invitationDoc.id,
      ...invitationDoc.data(),
    }
  }

  /**
   * Accept invitation and add business role to user
   */
  static async acceptInvitation(invitationToken: string, userUid: string) {
    // Find invitation by token
    const invitation = await this.getInvitationByToken(invitationToken)

    // Update invitation status
    const invitationRef = doc(db, "invitations", invitation.id)
    await updateDoc(invitationRef, {
      status: "accepted",
      accepted_at: Timestamp.now(),
      accepted_by_uid: userUid,
      updated_at: Timestamp.now(),
    })

    // Add business role to user
    const userRef = doc(db, "users", userUid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      const userData = userSnap.data()
      const businessRoles = userData.business_roles || []

      // Check if role already exists (shouldn't happen, but safety check)
      const existingRoleIndex = businessRoles.findIndex(
        (r: any) => r.business_id === invitation.business_id
      )

      if (existingRoleIndex >= 0) {
        // Update existing role
        businessRoles[existingRoleIndex] = {
          business_id: invitation.business_id,
          role: invitation.role,
          permissions: invitation.permissions,
          added_at: businessRoles[existingRoleIndex].added_at,
          updated_at: Timestamp.now(),
        }
      } else {
        // Add new role
        businessRoles.push({
          business_id: invitation.business_id,
          role: invitation.role,
          permissions: invitation.permissions,
          added_at: Timestamp.now(),
        })
      }

      await updateDoc(userRef, {
        business_roles: businessRoles,
        user_type: "business_team",
        updated_at: Timestamp.now(),
        verified: true,
      })
    }

    return invitation
  }

  /**
   * Check for pending invitations on login
   */
  static async getPendingInvitationsForEmail(email: string) {
    const q = query(
      collection(db, "invitations"),
      where("invited_email", "==", email),
      where("status", "==", "pending")
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  }

  /**
   * Cancel invitation
   */
  static async cancelInvitation(invitationId: string, reason?: string) {
    await updateDoc(doc(db, "invitations", invitationId), {
      status: "cancelled",
      cancellation_reason: reason || "Cancelled by sender",
      updated_at: Timestamp.now(),
    })
  }

  /**
   * Resend invitation email
   */
  static async resendInvitation(invitationId: string) {
    const invitationRef = doc(db, "invitations", invitationId)
    const invitationSnap = await getDoc(invitationRef)

    if (!invitationSnap.exists()) {
      throw new Error("Invitation not found")
    }

    const invitation = invitationSnap.data()

    if (invitation.status !== "pending") {
      throw new Error("Invitation is no longer pending")
    }

    // Update reminder tracking
    await updateDoc(invitationRef, {
      last_reminder_sent_at: Timestamp.now(),
      reminder_count: (invitation.reminder_count || 0) + 1,
      updated_at: Timestamp.now(),
    })

    return {
      id: invitationSnap.id,
      ...invitation,
    }
  }
}
