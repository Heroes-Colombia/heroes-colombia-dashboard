# Unified Invitation System - Implementation Plan (Dashboard)

**Created:** January 27, 2025
**Status:** Planning Phase
**Target Start:** January 28, 2025
**Estimated Duration:** 2 days

---

## Executive Summary

Implement a unified invitation system for the **Dashboard** that handles business team member invitations. Business owners can invite staff/managers to their dashboard with specific roles and permissions.

The same `invitations` collection will also support family member invitations (implemented in the mobile app separately).

---

## Architecture Overview

### Unified Invitations Collection Schema

**Collection:** `invitations/{invitationId}`

```typescript
interface Invitation {
  // Core Fields
  id: string
  invitation_type: "business_team" | "family_member"
  invited_email: string
  status: "pending" | "accepted" | "rejected" | "cancelled"

  // Sender Information
  sender_uid: string
  sender_email: string
  sender_name: string

  // Business Team Specific (when invitation_type = "business_team")
  business_id?: string
  business_name?: string
  role?: BusinessPermission // "owner" | "manager" | "staff"
  permissions?: TeamPermissions

  // Family Member Specific (when invitation_type = "family_member")
  // Used by mobile app only
  inviter_military_id?: string
  inviter_rank?: string
  relationship?: string // "spouse" | "parent" | "child"

  // Token & Security
  invitation_token: string // Unique secure token for email link

  // Acceptance Tracking
  accepted_at?: Timestamp
  accepted_by_uid?: string
  rejected_at?: Timestamp
  cancellation_reason?: string

  // Metadata
  created_at: Timestamp
  updated_at: Timestamp
  last_reminder_sent_at?: Timestamp
  reminder_count?: number
}
```

**Key Changes from Original:**
- ❌ NO expiration - invitations stay pending until accepted/cancelled
- ✅ Invitation token allows auto-login for new users
- ✅ Simplified status flow

---

## Use Case: Business Team Invitations (Dashboard Only)

### User Flow

```
Business Owner (Dashboard)
  ↓
1. Clicks "Invite Team Member"
  ↓
2. Fills form: email, role, permissions
  ↓
3. System creates invitation document
  ↓
4. Email sent via Resend with magic link (contains token)
  ↓
5A. User clicks link → Redirected to /auth/accept-invitation?token=XXX
5B. System checks if user exists in Firebase Auth
  ↓
6A. User EXISTS → Auto-login via token → business_roles updated → Dashboard
6B. User DOESN'T EXIST → Create account via token → business_roles added → Dashboard
  ↓
7. User logs into dashboard with assigned permissions
```

**Key Insight:** The invitation token acts as a **one-time login credential** that:
- Creates the account if it doesn't exist
- Logs the user in automatically
- Adds the business role
- Marks invitation as accepted

---

## Implementation Components

### 1. Backend Services (NEW)

#### File: `lib/services/invitation-service.ts`

```typescript
import { db } from "@/lib/firebase"
import { collection, addDoc, updateDoc, doc, query, where, getDocs, getDoc, Timestamp } from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"
import { BusinessPermission, TeamPermissions } from "@/lib/types"

export class InvitationService {
  /**
   * Create business team invitation
   */
  static async createBusinessTeamInvitation(params: {
    businessId: string
    businessName: string
    invitedEmail: string
    inviterUid: string
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
      invitation_token: invitationToken,
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
```

---

#### File: `lib/services/email-service.ts`

```typescript
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export class EmailService {
  /**
   * Send business team invitation email
   */
  static async sendTeamInvitation(params: {
    to: string
    inviterName: string
    businessName: string
    role: string
    invitationToken: string
  }) {
    const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invitation?token=${params.invitationToken}`

    try {
      const { data, error } = await resend.emails.send({
        from: "Héroes Colombia <invitaciones@heroescolombia.com>",
        to: params.to,
        subject: `Invitación al equipo de ${params.businessName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

              <!-- Header -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0070f3; margin: 0;">Héroes Colombia</h1>
              </div>

              <!-- Main Content -->
              <div style="background: #f9f9f9; border-radius: 8px; padding: 30px;">
                <h2 style="color: #333; margin-top: 0;">Invitación al equipo de ${params.businessName}</h2>

                <p style="font-size: 16px; color: #555;">
                  <strong>${params.inviterName}</strong> te ha invitado a unirte al equipo de
                  <strong>${params.businessName}</strong> como <strong>${params.role}</strong>.
                </p>

                <p style="font-size: 16px; color: #555;">
                  Podrás acceder al panel de administración y gestionar las promociones de acuerdo a los permisos asignados.
                </p>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${acceptUrl}"
                     style="background: #0070f3;
                            color: white;
                            padding: 14px 28px;
                            text-decoration: none;
                            border-radius: 6px;
                            display: inline-block;
                            font-weight: 600;
                            font-size: 16px;">
                    Aceptar Invitación
                  </a>
                </div>

                <!-- Alternative Link -->
                <p style="font-size: 14px; color: #666; text-align: center;">
                  O copia este enlace en tu navegador:<br>
                  <a href="${acceptUrl}" style="color: #0070f3; word-break: break-all;">${acceptUrl}</a>
                </p>
              </div>

              <!-- Footer -->
              <div style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">
                <p>
                  Si no solicitaste esta invitación, puedes ignorar este correo de forma segura.
                </p>
                <p>
                  © ${new Date().getFullYear()} Héroes Colombia. Todos los derechos reservados.
                </p>
              </div>

            </body>
          </html>
        `,
      })

      if (error) {
        console.error("Resend error:", error)
        throw error
      }

      return data
    } catch (error) {
      console.error("Error sending invitation email:", error)
      throw error
    }
  }
}
```

---

### 2. Frontend Updates

#### File: `app/business/dashboard/team/page.tsx`

**Add imports at the top:**

```typescript
import { InvitationService } from "@/lib/services/invitation-service"
import { EmailService } from "@/lib/services/email-service"
```

**Replace handleInviteTeamMember function (lines 171-220):**

```typescript
const handleInviteTeamMember = async () => {
  if (!businessId || !newInvitation.email) return

  if (!canInviteMore) {
    alert(`Has alcanzado el límite de ${teamLimit} miembros del equipo para tu plan. Actualiza tu plan para invitar más miembros.`)
    return
  }

  // Simple email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newInvitation.email)) {
    alert("Por favor ingresa un correo electrónico válido")
    return
  }

  setIsLoading(true)
  try {
    // Create invitation
    const invitation = await InvitationService.createBusinessTeamInvitation({
      businessId,
      businessName: businessUser?.businessName || "tu negocio",
      invitedEmail: newInvitation.email.toLowerCase().trim(),
      inviterUid: user.uid,
      inviterEmail: user.email!,
      inviterName: businessUser?.name || user.email!,
      role: newInvitation.role,
      permissions: newInvitation.permissions,
    })

    // Send email via Resend
    await EmailService.sendTeamInvitation({
      to: newInvitation.email.toLowerCase().trim(),
      inviterName: businessUser?.name || user.email!,
      businessName: businessUser?.businessName || "tu negocio",
      role: roleConfig[newInvitation.role].label,
      invitationToken: invitation.invitation_token,
    })

    alert(`✅ Invitación enviada exitosamente a ${newInvitation.email}`)
    setIsInviteDialogOpen(false)

    // Reset form
    setNewInvitation({
      email: "",
      name: "",
      role: BusinessPermission.staff,
      permissions: DEFAULT_PERMISSIONS[BusinessPermission.staff],
    })

    // Refresh to show pending invitation
    await fetchPendingInvitations()
  } catch (error) {
    console.error("Error inviting team member:", error)
    alert("Error: No se pudo enviar la invitación. Por favor intenta de nuevo.")
  } finally {
    setIsLoading(false)
  }
}
```

**Add state and functions for pending invitations (after existing state declarations):**

```typescript
const [pendingInvitations, setPendingInvitations] = useState<any[]>([])

// Fetch pending invitations
const fetchPendingInvitations = async () => {
  if (!businessId) return

  try {
    const invitations = await InvitationService.getPendingBusinessInvitations(businessId)
    setPendingInvitations(invitations)
  } catch (error) {
    console.error("Error fetching pending invitations:", error)
  }
}

useEffect(() => {
  fetchPendingInvitations()
}, [businessId])

const handleResendInvitation = async (invitationId: string, invitation: any) => {
  try {
    await InvitationService.resendInvitation(invitationId)

    await EmailService.sendTeamInvitation({
      to: invitation.invited_email,
      inviterName: invitation.sender_name,
      businessName: invitation.business_name,
      role: roleConfig[invitation.role].label,
      invitationToken: invitation.invitation_token,
    })

    alert("Invitación reenviada exitosamente")
  } catch (error) {
    console.error("Error resending invitation:", error)
    alert("Error al reenviar la invitación")
  }
}

const handleCancelInvitation = async (invitationId: string) => {
  if (!confirm("¿Estás seguro de cancelar esta invitación?")) return

  try {
    await InvitationService.cancelInvitation(invitationId)
    await fetchPendingInvitations()
    alert("Invitación cancelada")
  } catch (error) {
    console.error("Error cancelling invitation:", error)
    alert("Error al cancelar la invitación")
  }
}
```

**Add pending invitations section (after Current User Card, before Team Members List):**

```tsx
{/* Pending Invitations */}
{pendingInvitations.length > 0 && (
  <Card className="border-orange-200 bg-orange-50/50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-orange-600" />
        Invitaciones Pendientes
      </CardTitle>
      <CardDescription>
        Miembros invitados que aún no han aceptado
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {pendingInvitations.map((invitation) => (
        <div
          key={invitation.id}
          className="flex items-center justify-between p-4 bg-white rounded-lg border"
        >
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-orange-100 text-orange-700">
                <Mail className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{invitation.invited_email}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getRoleBadge(invitation.role)}
                <span>•</span>
                <span>Invitado: {formatDate(invitation.created_at.toDate())}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleResendInvitation(invitation.id, invitation)}
            >
              <Mail className="h-4 w-4 mr-1" />
              Reenviar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCancelInvitation(invitation.id)}
            >
              <XCircle className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
)}
```

---

#### File: `app/auth/accept-invitation/page.tsx` (NEW)

```typescript
"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { InvitationService } from "@/lib/services/invitation-service"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Enlace de invitación inválido")
      return
    }

    handleInvitation()
  }, [token])

  const handleInvitation = async () => {
    try {
      // Get invitation details
      const invitation = await InvitationService.getInvitationByToken(token!)

      if (invitation.invitation_type !== "business_team") {
        throw new Error("Este enlace es solo para invitaciones de equipo")
      }

      const auth = getAuth()

      // Check if user is already logged in
      if (auth.currentUser) {
        // User is logged in - verify email matches
        if (auth.currentUser.email?.toLowerCase() !== invitation.invited_email.toLowerCase()) {
          throw new Error("Debes iniciar sesión con el correo invitado: " + invitation.invited_email)
        }

        // Accept invitation for existing user
        await InvitationService.acceptInvitation(token!, auth.currentUser.uid)

        setStatus("success")
        setMessage(`¡Bienvenido al equipo de ${invitation.business_name}!`)

        // Redirect to dashboard
        setTimeout(() => {
          router.push("/business/dashboard")
        }, 2000)
        return
      }

      // User is not logged in - create account with invitation
      const tempPassword = generateSecurePassword()

      try {
        // Try to create new account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          invitation.invited_email,
          tempPassword
        )

        // Create user document
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: invitation.invited_email,
          user_type: "business_team",
          first_name: "",
          first_last_name: "",
          status: "active",
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        })

        // Accept invitation
        await InvitationService.acceptInvitation(token!, userCredential.user.uid)

        setStatus("success")
        setMessage(`¡Cuenta creada! Bienvenido al equipo de ${invitation.business_name}`)

        // Redirect to dashboard
        setTimeout(() => {
          router.push("/business/dashboard")
        }, 2000)
      } catch (authError: any) {
        if (authError.code === "auth/email-already-in-use") {
          // User exists but not logged in - show login prompt
          setStatus("error")
          setMessage(
            `Ya tienes una cuenta con ${invitation.invited_email}. Por favor inicia sesión para aceptar la invitación.`
          )

          // Redirect to login with invitation token
          setTimeout(() => {
            router.push(`/auth/login?invitation_token=${token}`)
          }, 3000)
        } else {
          throw authError
        }
      }
    } catch (error: any) {
      console.error("Error accepting invitation:", error)
      setStatus("error")
      setMessage(error.message || "Error al procesar la invitación")
    }
  }

  const generateSecurePassword = () => {
    // Generate a random secure password (user will be prompted to change it)
    return Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "loading" && "Procesando invitación..."}
            {status === "success" && "¡Invitación Aceptada!"}
            {status === "error" && "Error"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">
                  Estamos configurando tu acceso al equipo...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-center text-lg font-medium">{message}</p>
                <p className="text-center text-sm text-muted-foreground">
                  Serás redirigido al dashboard en unos segundos...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
                <p className="text-center text-lg font-medium">{message}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### 3. Permission Enforcement

#### File: `lib/middleware/permission-middleware.ts` (NEW)

```typescript
import { TeamPermissions } from "@/lib/types"

// Client-side permission checker (for UI)
export function hasPermission(
  businessRoles: any[],
  businessId: string,
  permission: keyof TeamPermissions
): boolean {
  const businessRole = businessRoles?.find((role: any) => role.business_id === businessId)
  return businessRole?.permissions?.[permission] === true
}

// Get user's role in business
export function getUserRole(businessRoles: any[], businessId: string) {
  return businessRoles?.find((role: any) => role.business_id === businessId)
}
```

---

#### File: `components/permission-guard.tsx` (NEW)

```typescript
"use client"

import { useAuth } from "@/hooks/use-auth"
import { TeamPermissions } from "@/lib/types"
import { ReactNode } from "react"
import { hasPermission } from "@/lib/middleware/permission-middleware"

interface PermissionGuardProps {
  permission: keyof TeamPermissions
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({ permission, fallback, children }: PermissionGuardProps) {
  const { user } = useAuth()
  const businessUser = user as any

  // Get current business context
  const businessId = businessUser?.businessId
  const businessRoles = businessUser?.business_roles || []

  // Check permission
  const hasAccess = hasPermission(businessRoles, businessId, permission)

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}

// Usage example:
// <PermissionGuard permission="can_manage_team">
//   <Button>Invite Team Member</Button>
// </PermissionGuard>
```

---

## Environment Variables

Add to `.env.local`:

```bash
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here

# App URL (for email links)
NEXT_PUBLIC_APP_URL=https://app.heroescolombia.com

# For local development:
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Testing Checklist

### Business Team Invitations
- [ ] Business owner can open invite dialog
- [ ] Form validation works (email format)
- [ ] Invitation created in Firestore
- [ ] Email sent via Resend
- [ ] Pending invitation shows in team list
- [ ] Email link redirects to /auth/accept-invitation
- [ ] New user: Account created automatically
- [ ] Existing user (not logged in): Redirected to login
- [ ] Existing user (logged in): Auto-accepted
- [ ] Business role added to user document
- [ ] Permissions correctly assigned
- [ ] Owner can resend invitation
- [ ] Owner can cancel invitation
- [ ] Cancelled invitations don't show in pending list

### Permission Enforcement
- [ ] PermissionGuard hides elements without permission
- [ ] Team page only accessible to can_manage_team users
- [ ] Promotions page respects can_manage_promotions
- [ ] Analytics page respects can_view_analytics

---

## Implementation Timeline

### Day 1: Backend + Services
**Morning:**
- ✅ Create InvitationService (invitation-service.ts)
- ✅ Create EmailService with Resend (email-service.ts)
- ✅ Test invitation creation in Firestore
- ✅ Test email sending via Resend

**Afternoon:**
- ✅ Update team/page.tsx with invitation flow
- ✅ Add pending invitations display
- ✅ Implement resend/cancel functionality
- ✅ Test invitation UI end-to-end

### Day 2: Acceptance Flow + Permissions
**Morning:**
- ✅ Create /auth/accept-invitation page
- ✅ Implement auto-account creation logic
- ✅ Test invitation acceptance flow (all scenarios)
- ✅ Verify business_roles added correctly

**Afternoon:**
- ✅ Create PermissionGuard component
- ✅ Add permission middleware helpers
- ✅ Apply guards to team page
- ✅ Test permission enforcement
- ✅ Final integration testing

---

## Success Metrics

- ✅ Business owners can successfully invite team members
- ✅ Invitation emails delivered via Resend
- ✅ New users can accept and auto-create accounts
- ✅ Existing users can accept and get business roles
- ✅ Permissions correctly assigned and enforced
- ✅ Pending invitations visible and manageable
- ✅ Email delivery rate > 95%

---

## Future Enhancements (Phase 2)

1. **Password Setup Flow**
   - Send password reset email after auto-account creation
   - Require password change on first login

2. **Invitation Analytics**
   - Track acceptance rates
   - Measure time to acceptance

3. **Bulk Invitations**
   - CSV upload for multiple team members

4. **Custom Email Templates**
   - Business-branded invitation emails
   - Customizable messages

---

**Ready to implement! 🚀**
