import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { getAdminFirestore } from "@/lib/firebase-admin"
import { getPlanFromMercadoPagoId } from "@/lib/mercadopago-plans"
import { sendTrialWelcomeEmail, sendSubscriptionActivatedEmail } from "@/lib/email"
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

interface PaymentData {
  id: number
  status: "pending" | "approved" | "authorized" | "in_process" | "in_mediation" | "rejected" | "cancelled" | "refunded" | "charged_back"
  status_detail: string
  external_reference: string
  transaction_amount: number
  currency_id: string
  payer: {
    id: number
    email: string
    first_name?: string
    last_name?: string
  }
  metadata: {
    business_id?: string
    business_name?: string
    payment_type?: string
    email?: string
  }
  date_created: string
  date_approved: string | null
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
 * Fetch payment details from Mercado Pago API
 */
async function fetchPaymentDetails(paymentId: string): Promise<PaymentData | null> {
  try {
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        },
      }
    )

    if (!response.ok) {
      console.error("[Webhook] Error fetching payment:", await response.text())
      return null
    }

    return response.json()
  } catch (error) {
    console.error("[Webhook] Error fetching payment details:", error)
    return null
  }
}

/**
 * Parse external_reference to extract business info for subscriptions
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
 * Parse external_reference to extract business info for trial payments
 * Format: trial_[businessId]_[timestamp]
 */
function parseTrialExternalReference(externalReference: string): {
  businessId: string
} | null {
  const parts = externalReference.split("_")
  if (parts.length < 2 || parts[0] !== "trial") {
    return null
  }

  return {
    businessId: parts[1],
  }
}

/**
 * Activate trial subscription after payment
 */
async function activateTrialSubscription(
  businessId: string,
  paymentData: PaymentData
) {
  const db = getAdminFirestore()
  const businessRef = db.collection("businesses").doc(businessId)

  const now = new Date()
  const endDate = new Date(now)
  endDate.setMonth(endDate.getMonth() + 2) // 2 months trial

  // Build the subscription object (matches BusinessSubscription type)
  const subscription = {
    type: "trial",
    status: "trial",
    plan: "trial",
    billing_period: null,
    start_date: Timestamp.fromDate(now),
    end_date: Timestamp.fromDate(endDate),
    current_period_start: null,
    current_period_end: null,
    next_payment_date: null,
    last_payment_date: Timestamp.fromDate(now),
    amount: paymentData.transaction_amount || 20000,
    currency: "COP",
    mercadopago_subscription_id: null,
    mercadopago_payer_id: paymentData.payer?.id || null,
    mercadopago_payer_email: paymentData.payer?.email || null,
    is_founder: false,
    created_at: Timestamp.now(),
    updated_at: Timestamp.now(),
  }

  // Update business document
  await businessRef.update({
    subscription: subscription,
    subscription_status: "trial",
    status: "active",
    plan: "enterprise", // Trial gets Enterprise features
    updated_at: Timestamp.now(),
  })

  console.log(`[Webhook] Activated trial for business ${businessId}, ends ${endDate.toISOString()}`)

  return { endDate }
}

/**
 * Update business subscription in Firebase
 * Writes to both the new subscription object and legacy fields for backward compatibility
 */
async function updateBusinessSubscription(
  businessId: string,
  plan: string,
  billingPeriod: string,
  subscriptionData: PreapprovalData
) {
  const db = getAdminFirestore()
  const businessRef = db.collection("businesses").doc(businessId)

  const now = Timestamp.now()
  const startDate = Timestamp.fromDate(new Date(subscriptionData.date_created))
  const nextPaymentDate = subscriptionData.next_payment_date
    ? Timestamp.fromDate(new Date(subscriptionData.next_payment_date))
    : null

  // Calculate current_period_end (for annual: 1 year from start, for monthly: 1 month from start)
  const periodEndDate = new Date(subscriptionData.date_created)
  if (billingPeriod === "annual") {
    periodEndDate.setFullYear(periodEndDate.getFullYear() + 1)
  } else {
    periodEndDate.setMonth(periodEndDate.getMonth() + 1)
  }

  // Check if this is a Fundador conversion (trial -> fundador)
  const isFounder = plan === "fundador"

  // Build the subscription object (matches BusinessSubscription type)
  const subscription = {
    type: "mercadopago",
    status: subscriptionData.status === "authorized" ? "active" : "pending_payment",
    plan: plan,
    billing_period: billingPeriod,
    start_date: startDate,
    end_date: null, // Active subscriptions don't have end dates
    current_period_start: startDate,
    current_period_end: Timestamp.fromDate(periodEndDate),
    next_payment_date: nextPaymentDate,
    last_payment_date: subscriptionData.status === "authorized" ? now : null,
    amount: subscriptionData.auto_recurring?.transaction_amount || 0,
    currency: "COP",
    mercadopago_subscription_id: subscriptionData.id,
    mercadopago_payer_id: subscriptionData.payer_id,
    mercadopago_payer_email: subscriptionData.payer_email || null,
    is_founder: isFounder,
    created_at: now,
    updated_at: now,
  }

  // Update business document with new subscription object and legacy fields
  await businessRef.update({
    subscription: subscription,
    // Legacy fields for backward compatibility
    plan: plan,
    subscription_status: subscriptionData.status === "authorized" ? "active" : "pending",
    mercadopago_subscription_id: subscriptionData.id,
    mercadopago_payer_id: subscriptionData.payer_id,
    billing_period: billingPeriod,
    subscription_start_date: startDate,
    next_payment_date: nextPaymentDate,
    // Set is_founder at business level too
    is_founder: isFounder,
    updated_at: now,
  })

  console.log(`[Webhook] Updated business ${businessId} with plan ${plan}, is_founder: ${isFounder}`)
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
            // Fetch business name for email
            const db = getAdminFirestore()
            const businessRef = db.collection("businesses").doc(businessInfo.businessId)
            const businessDoc = await businessRef.get()
            const businessName = businessDoc.data()?.name || "Tu Negocio"

            // Use the new sendSubscriptionActivatedEmail for better Fundador handling
            await sendSubscriptionActivatedEmail({
              email: subscriptionData.payer_email,
              businessName: businessName,
              plan: businessInfo.plan,
              billingPeriod: businessInfo.billingPeriod,
              nextPaymentDate: subscriptionData.next_payment_date,
              isFounder: businessInfo.plan === "fundador",
            })
          } catch (emailError) {
            console.error("[Webhook] Error sending confirmation email:", emailError)
            // Don't fail the webhook for email errors
          }
        }
      }
    }

    // Handle one-time payment events (trial payments)
    if (body.type === "payment") {
      const paymentId = body.data.id

      // Fetch payment details
      const paymentData = await fetchPaymentDetails(paymentId)
      if (!paymentData) {
        console.error("[Webhook] Could not fetch payment details")
        return NextResponse.json({ error: "Could not fetch payment" }, { status: 400 })
      }

      console.log("[Webhook] Payment data:", {
        id: paymentData.id,
        status: paymentData.status,
        external_reference: paymentData.external_reference,
        payer_email: paymentData.payer?.email,
        amount: paymentData.transaction_amount,
        metadata: paymentData.metadata,
      })

      // Check if this is a trial payment
      const trialInfo = parseTrialExternalReference(paymentData.external_reference || "")

      if (trialInfo && paymentData.status === "approved") {
        console.log("[Webhook] Processing approved trial payment for business:", trialInfo.businessId)

        // Activate trial subscription
        const { endDate } = await activateTrialSubscription(trialInfo.businessId, paymentData)

        // Create transaction record for trial
        const db = getAdminFirestore()
        const transactionsRef = db.collection("transactions")
        await transactionsRef.add({
          business_id: trialInfo.businessId,
          payment_id: paymentData.id.toString(),
          type: "trial",
          amount: paymentData.transaction_amount,
          currency: "COP",
          plan: "trial",
          billing_period: null,
          payment_method: "mercadopago",
          payment_reference: paymentData.id.toString(),
          payment_status: "approved",
          created_at: Timestamp.now(),
        })

        // Get business details for email
        const businessRef = db.collection("businesses").doc(trialInfo.businessId)
        const businessDoc = await businessRef.get()
        const businessName = businessDoc.data()?.name || "Tu Negocio"

        // Send trial welcome email
        try {
          await sendTrialWelcomeEmail({
            email: paymentData.payer?.email || paymentData.metadata?.email || "",
            businessName: businessName,
            trialEndDate: endDate,
          })
        } catch (emailError) {
          console.error("[Webhook] Error sending trial welcome email:", emailError)
          // Don't fail the webhook for email errors
        }
      } else if (trialInfo) {
        console.log(`[Webhook] Trial payment not approved yet. Status: ${paymentData.status}`)
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
