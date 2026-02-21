import { NextRequest, NextResponse } from "next/server"
import { getAdminFirestore } from "@/lib/firebase-admin"
import { getAuth } from "firebase-admin/auth"
import { getFirebaseAdmin } from "@/lib/firebase-admin"
import { Timestamp } from "firebase-admin/firestore"
import type { SubscriptionStatus, SubscriptionPlan, BillingPeriod } from "@/lib/types"

/**
 * Admin Subscription API
 *
 * Allows admins to manually manage business subscriptions:
 * - Extend trial
 * - Set trial end date
 * - Mark as expired
 * - Manually activate subscription (for bank transfers)
 * - Cancel subscription
 * - Update subscription status
 */

interface AdminSubscriptionUpdateBody {
  businessId: string
  action:
    | "extend_trial"
    | "set_trial_end_date"
    | "expire"
    | "activate_subscription"
    | "cancel"
    | "update_status"
  // For extend_trial: number of days to extend
  days?: number
  // For set_trial_end_date: ISO date string
  endDate?: string
  // For update_status: new status
  status?: SubscriptionStatus
  // For activate_subscription: subscription details
  plan?: SubscriptionPlan
  billingPeriod?: BillingPeriod
  amount?: number
  notes?: string
}

/**
 * Verify that the request is from an authenticated admin user
 */
async function verifyAdminAuth(req: NextRequest): Promise<{ uid: string; email: string } | null> {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.split("Bearer ")[1]
    const { app } = getFirebaseAdmin()
    const auth = getAuth(app)
    const decodedToken = await auth.verifyIdToken(token)

    // Check if user is admin in Firestore
    const db = getAdminFirestore()
    const userDoc = await db.collection("users").doc(decodedToken.uid).get()

    if (!userDoc.exists) {
      return null
    }

    const userData = userDoc.data()
    if (userData?.user_type !== "admin" && userData?.role !== "admin") {
      return null
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
    }
  } catch (error) {
    console.error("[Admin Subscription API] Auth error:", error)
    return null
  }
}

/**
 * Log admin action for audit trail
 */
async function logAdminAction(
  adminUid: string,
  adminEmail: string,
  businessId: string,
  action: string,
  details: Record<string, unknown>
) {
  try {
    const db = getAdminFirestore()
    await db.collection("admin_audit_log").add({
      admin_uid: adminUid,
      admin_email: adminEmail,
      business_id: businessId,
      action: action,
      details: details,
      created_at: Timestamp.now(),
    })
  } catch (error) {
    console.error("[Admin Subscription API] Error logging action:", error)
    // Don't fail the request for logging errors
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminAuth(req)
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const body: AdminSubscriptionUpdateBody = await req.json()
    const { businessId, action } = body

    if (!businessId || !action) {
      return NextResponse.json(
        { error: "businessId and action are required" },
        { status: 400 }
      )
    }

    const db = getAdminFirestore()
    const businessRef = db.collection("businesses").doc(businessId)
    const businessDoc = await businessRef.get()

    if (!businessDoc.exists) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      )
    }

    const businessData = businessDoc.data()
    const now = Timestamp.now()

    switch (action) {
      case "extend_trial": {
        if (!body.days || body.days <= 0) {
          return NextResponse.json(
            { error: "days is required and must be positive" },
            { status: 400 }
          )
        }

        const currentEndDate = businessData?.subscription?.end_date?.toDate() || new Date()
        const newEndDate = new Date(currentEndDate)
        newEndDate.setDate(newEndDate.getDate() + body.days)

        await businessRef.update({
          "subscription.end_date": Timestamp.fromDate(newEndDate),
          "subscription.updated_at": now,
          updated_at: now,
        })

        await logAdminAction(admin.uid, admin.email, businessId, "extend_trial", {
          days: body.days,
          new_end_date: newEndDate.toISOString(),
          notes: body.notes,
        })

        return NextResponse.json({
          success: true,
          message: `Trial extended by ${body.days} days`,
          newEndDate: newEndDate.toISOString(),
        })
      }

      case "set_trial_end_date": {
        if (!body.endDate) {
          return NextResponse.json(
            { error: "endDate is required" },
            { status: 400 }
          )
        }

        const newEndDate = new Date(body.endDate)
        if (isNaN(newEndDate.getTime())) {
          return NextResponse.json(
            { error: "Invalid endDate format" },
            { status: 400 }
          )
        }

        await businessRef.update({
          "subscription.end_date": Timestamp.fromDate(newEndDate),
          "subscription.updated_at": now,
          updated_at: now,
        })

        await logAdminAction(admin.uid, admin.email, businessId, "set_trial_end_date", {
          new_end_date: newEndDate.toISOString(),
          notes: body.notes,
        })

        return NextResponse.json({
          success: true,
          message: "Trial end date updated",
          newEndDate: newEndDate.toISOString(),
        })
      }

      case "expire": {
        await businessRef.update({
          "subscription.status": "expired",
          "subscription.updated_at": now,
          subscription_status: "expired", // Legacy field
          updated_at: now,
        })

        await logAdminAction(admin.uid, admin.email, businessId, "expire", {
          notes: body.notes,
        })

        return NextResponse.json({
          success: true,
          message: "Subscription marked as expired",
        })
      }

      case "activate_subscription": {
        if (!body.plan || !body.billingPeriod) {
          return NextResponse.json(
            { error: "plan and billingPeriod are required for activation" },
            { status: 400 }
          )
        }

        const startDate = new Date()
        const periodEndDate = new Date(startDate)
        if (body.billingPeriod === "annual") {
          periodEndDate.setFullYear(periodEndDate.getFullYear() + 1)
        } else {
          periodEndDate.setMonth(periodEndDate.getMonth() + 1)
        }

        const isFounder = body.plan === "fundador"

        const subscription = {
          type: "manual",
          status: "active",
          plan: body.plan,
          billing_period: body.billingPeriod,
          start_date: Timestamp.fromDate(startDate),
          end_date: null,
          current_period_start: Timestamp.fromDate(startDate),
          current_period_end: Timestamp.fromDate(periodEndDate),
          next_payment_date: Timestamp.fromDate(periodEndDate),
          last_payment_date: now,
          amount: body.amount || 0,
          currency: "COP",
          mercadopago_subscription_id: null,
          mercadopago_payer_id: null,
          mercadopago_payer_email: null,
          is_founder: isFounder,
          created_at: now,
          updated_at: now,
        }

        await businessRef.update({
          subscription: subscription,
          plan: body.plan,
          subscription_status: "active",
          is_founder: isFounder,
          updated_at: now,
        })

        await logAdminAction(admin.uid, admin.email, businessId, "activate_subscription", {
          plan: body.plan,
          billing_period: body.billingPeriod,
          amount: body.amount,
          is_founder: isFounder,
          notes: body.notes,
        })

        return NextResponse.json({
          success: true,
          message: `Subscription activated with plan ${body.plan}`,
          plan: body.plan,
          billingPeriod: body.billingPeriod,
          isFounder,
        })
      }

      case "cancel": {
        await businessRef.update({
          "subscription.status": "cancelled",
          "subscription.updated_at": now,
          subscription_status: "cancelled", // Legacy field
          updated_at: now,
        })

        await logAdminAction(admin.uid, admin.email, businessId, "cancel", {
          notes: body.notes,
        })

        return NextResponse.json({
          success: true,
          message: "Subscription cancelled",
        })
      }

      case "update_status": {
        if (!body.status) {
          return NextResponse.json(
            { error: "status is required" },
            { status: 400 }
          )
        }

        const validStatuses: SubscriptionStatus[] = [
          "pending_payment",
          "trial",
          "active",
          "past_due",
          "cancelled",
          "expired",
        ]

        if (!validStatuses.includes(body.status)) {
          return NextResponse.json(
            { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
            { status: 400 }
          )
        }

        await businessRef.update({
          "subscription.status": body.status,
          "subscription.updated_at": now,
          subscription_status: body.status, // Legacy field
          updated_at: now,
        })

        await logAdminAction(admin.uid, admin.email, businessId, "update_status", {
          new_status: body.status,
          notes: body.notes,
        })

        return NextResponse.json({
          success: true,
          message: `Subscription status updated to ${body.status}`,
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("[Admin Subscription API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch subscription details for a business
export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminAuth(req)
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const businessId = searchParams.get("businessId")

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId query parameter is required" },
        { status: 400 }
      )
    }

    const db = getAdminFirestore()
    const businessDoc = await db.collection("businesses").doc(businessId).get()

    if (!businessDoc.exists) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      )
    }

    const businessData = businessDoc.data()

    return NextResponse.json({
      success: true,
      subscription: businessData?.subscription || null,
      legacyFields: {
        plan: businessData?.plan,
        subscription_status: businessData?.subscription_status,
        is_founder: businessData?.is_founder,
      },
    })
  } catch (error) {
    console.error("[Admin Subscription API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
