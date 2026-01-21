import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { getAdminFirestore } from "@/lib/firebase-admin"
import { getPlanFromMercadoPagoId } from "@/lib/mercadopago-plans"
import { sendSubscriptionConfirmationEmail } from "@/lib/email"
import { Timestamp } from "firebase-admin/firestore"

const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET!
const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!

interface MercadoPagoWebhookPayload {
  id: number
  live_mode: boolean
  type: string
  date_created: string
  user_id: number
  api_version: string
  action: string
  data: {
    id: string
  }
}

interface PreapprovalData {
  id: string
  payer_id: number
  payer_email: string
  back_url: string
  collector_id: number
  application_id: number
  status: "pending" | "authorized" | "paused" | "cancelled"
  reason: string
  external_reference: string
  date_created: string
  last_modified: string
  init_point: string
  preapproval_plan_id: string
  auto_recurring: {
    frequency: number
    frequency_type: string
    transaction_amount: number
    currency_id: string
  }
  summarized: {
    quotas: number | null
    charged_quantity: number
    pending_charge_quantity: number | null
    charged_amount: number
    pending_charge_amount: number | null
    semaphore: string | null
    last_charged_date: string | null
    last_charged_amount: number | null
  }
  next_payment_date: string
  payment_method_id: string
  first_invoice_offset: number | null
}

/**
 * Verify the webhook signature from Mercado Pago
 */
function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  if (!xSignature || !xRequestId || !MERCADOPAGO_WEBHOOK_SECRET) {
    console.warn("[Webhook] Missing signature data for verification")
    return false
  }

  try {
    // Parse the x-signature header
    // Format: ts=timestamp,v1=signature
    const parts = xSignature.split(",")
    const tsMatch = parts.find((p) => p.startsWith("ts="))
    const v1Match = parts.find((p) => p.startsWith("v1="))

    if (!tsMatch || !v1Match) {
      console.warn("[Webhook] Invalid signature format")
      return false
    }

    const ts = tsMatch.replace("ts=", "")
    const v1 = v1Match.replace("v1=", "")

    // Build the manifest string
    // Format: id:[data.id];request-id:[x-request-id];ts:[ts];
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

    // Calculate expected signature
    const expectedSignature = createHmac("sha256", MERCADOPAGO_WEBHOOK_SECRET)
      .update(manifest)
      .digest("hex")

    return expectedSignature === v1
  } catch (error) {
    console.error("[Webhook] Error verifying signature:", error)
    return false
  }
}

/**
 * Fetch subscription details from Mercado Pago API
 */
async function fetchSubscriptionDetails(subscriptionId: string): Promise<PreapprovalData | null> {
  try {
    const response = await fetch(
      `https://api.mercadopago.com/preapproval/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      console.error("[Webhook] Error fetching subscription:", await response.text())
      return null
    }

    return response.json()
  } catch (error) {
    console.error("[Webhook] Error fetching subscription details:", error)
    return null
  }
}

/**
 * Parse external_reference to extract business info
 * Format: subscription_[businessId]_[plan]_[billingPeriod]_[timestamp]
 */
function parseExternalReference(externalReference: string): {
  businessId: string
  plan: string
  billingPeriod: string
} | null {
  const parts = externalReference.split("_")
  if (parts.length < 4 || parts[0] !== "subscription") {
    return null
  }

  return {
    businessId: parts[1],
    plan: parts[2],
    billingPeriod: parts[3],
  }
}

/**
 * Update business subscription in Firebase
 */
async function updateBusinessSubscription(
  businessId: string,
  plan: string,
  billingPeriod: string,
  subscriptionData: PreapprovalData
) {
  const db = getAdminFirestore()
  const businessRef = db.collection("businesses").doc(businessId)

  const updateData: Record<string, unknown> = {
    plan: plan,
    subscription_status: subscriptionData.status === "authorized" ? "active" : "pending",
    mercadopago_subscription_id: subscriptionData.id,
    mercadopago_payer_id: subscriptionData.payer_id,
    billing_period: billingPeriod,
    subscription_start_date: Timestamp.fromDate(new Date(subscriptionData.date_created)),
    next_payment_date: subscriptionData.next_payment_date
      ? Timestamp.fromDate(new Date(subscriptionData.next_payment_date))
      : null,
    updated_at: Timestamp.now(),
  }

  await businessRef.update(updateData)

  console.log(`[Webhook] Updated business ${businessId} with plan ${plan}`)
}

/**
 * Create transaction record in Firebase
 */
async function createTransactionRecord(
  businessId: string,
  plan: string,
  billingPeriod: string,
  subscriptionData: PreapprovalData
) {
  const db = getAdminFirestore()
  const transactionsRef = db.collection("transactions")

  const transactionData = {
    business_id: businessId,
    subscription_id: subscriptionData.id,
    type: "subscription",
    amount: subscriptionData.auto_recurring?.transaction_amount || 0,
    currency: "COP",
    plan: plan,
    billing_period: billingPeriod,
    payment_method: "mercadopago",
    payment_reference: subscriptionData.id,
    payment_status: subscriptionData.status === "authorized" ? "approved" : "pending",
    created_at: Timestamp.now(),
  }

  const docRef = await transactionsRef.add(transactionData)
  console.log(`[Webhook] Created transaction ${docRef.id} for business ${businessId}`)
}

export async function POST(req: NextRequest) {
  try {
    // Get headers for signature verification
    const xSignature = req.headers.get("x-signature")
    const xRequestId = req.headers.get("x-request-id")

    const body: MercadoPagoWebhookPayload = await req.json()

    console.log("[Webhook] Received notification:", {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
    })

    // Verify signature
    const isValid = verifyWebhookSignature(xSignature, xRequestId, body.data?.id)
    if (!isValid) {
      console.warn("[Webhook] Invalid signature, but processing anyway for development")
      // In production, you might want to reject invalid signatures:
      // return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Handle subscription events
    if (body.type === "subscription_preapproval" || body.type === "subscription_authorized_payment") {
      const subscriptionId = body.data.id

      // Fetch full subscription details
      const subscriptionData = await fetchSubscriptionDetails(subscriptionId)
      if (!subscriptionData) {
        console.error("[Webhook] Could not fetch subscription details")
        return NextResponse.json({ error: "Could not fetch subscription" }, { status: 400 })
      }

      console.log("[Webhook] Subscription data:", {
        id: subscriptionData.id,
        status: subscriptionData.status,
        external_reference: subscriptionData.external_reference,
        payer_email: subscriptionData.payer_email,
        preapproval_plan_id: subscriptionData.preapproval_plan_id,
      })

      // Parse business info from external reference
      const businessInfo = parseExternalReference(subscriptionData.external_reference)
      if (!businessInfo) {
        // Try to get plan info from preapproval_plan_id
        const planInfo = getPlanFromMercadoPagoId(subscriptionData.preapproval_plan_id)
        if (!planInfo) {
          console.error("[Webhook] Could not determine plan info")
          return NextResponse.json({ error: "Invalid external reference" }, { status: 400 })
        }

        console.warn("[Webhook] Could not parse external reference, using plan ID lookup")
        // We can't update without businessId
        return NextResponse.json({ received: true, warning: "Missing businessId" })
      }

      // Handle based on action
      if (
        body.action === "created" ||
        body.action === "updated" ||
        subscriptionData.status === "authorized"
      ) {
        // Update business subscription
        await updateBusinessSubscription(
          businessInfo.businessId,
          businessInfo.plan,
          businessInfo.billingPeriod,
          subscriptionData
        )

        // Create transaction record
        await createTransactionRecord(
          businessInfo.businessId,
          businessInfo.plan,
          businessInfo.billingPeriod,
          subscriptionData
        )

        // Send confirmation email if subscription is authorized
        if (subscriptionData.status === "authorized") {
          try {
            await sendSubscriptionConfirmationEmail({
              email: subscriptionData.payer_email,
              plan: businessInfo.plan,
              billingPeriod: businessInfo.billingPeriod,
              nextPaymentDate: subscriptionData.next_payment_date,
            })
          } catch (emailError) {
            console.error("[Webhook] Error sending confirmation email:", emailError)
            // Don't fail the webhook for email errors
          }
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Webhook] Unexpected error:", error)
    // Return 200 anyway to prevent Mercado Pago from retrying
    return NextResponse.json({ received: true, error: "Internal error" })
  }
}

// Also handle GET for webhook verification
export async function GET(req: NextRequest) {
  return NextResponse.json({ status: "Webhook endpoint active" })
}
