import { NextRequest, NextResponse } from "next/server"
import { getMercadoPagoPlanId } from "@/lib/mercadopago-plans"
import { sendTrialAdminEmail } from "@/lib/email"
import type { PlanType, BillingPeriod } from "@/lib/types"

interface SetupPlanRequestBody {
  plan: PlanType
  billingPeriod: BillingPeriod
  email: string
  businessName: string
  businessId: string
  phone?: string
}

export async function POST(req: NextRequest) {
  try {
    const body: SetupPlanRequestBody = await req.json()
    const { plan, billingPeriod, email, businessName, businessId, phone } = body

    // Validate required fields
    if (!plan || !billingPeriod || !email || !businessName || !businessId) {
      return NextResponse.json(
        { error: "Plan, periodo de facturación, email, nombre de negocio y ID son requeridos" },
        { status: 400 }
      )
    }

    // Validate plan type
    if (!["basico", "pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Plan inválido. Debe ser: basico, pro o enterprise" },
        { status: 400 }
      )
    }

    // Validate billing period
    if (!["monthly", "annual"].includes(billingPeriod)) {
      return NextResponse.json(
        { error: "Periodo de facturación inválido. Debe ser: monthly o annual" },
        { status: 400 }
      )
    }

    // Get the Mercado Pago plan ID for the selected plan and billing period
    const preapprovalPlanId = getMercadoPagoPlanId(plan, billingPeriod)

    // Build the Mercado Pago hosted checkout URL
    // This URL redirects users to MP's subscription checkout page where they enter their card
    const checkoutUrl = new URL("https://www.mercadopago.com.co/subscriptions/checkout")
    checkoutUrl.searchParams.set("preapproval_plan_id", preapprovalPlanId)

    // Add external_reference for tracking (MP will include this in webhooks)
    const externalReference = `subscription_${businessId}_${plan}_${billingPeriod}_${Date.now()}`
    checkoutUrl.searchParams.set("external_reference", externalReference)

    // Pre-fill payer email if possible
    checkoutUrl.searchParams.set("payer_email", email)

    console.log("[Setup Plan API] Redirecting to MP checkout:", {
      plan,
      billingPeriod,
      preapprovalPlanId,
      checkoutUrl: checkoutUrl.toString(),
      externalReference,
    })

    // Send notification email to admin
    await sendTrialAdminEmail({
      businessName,
      email,
      phone,
    })

    // Return checkout URL for redirect
    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutUrl.toString(),
      preapprovalPlanId,
      externalReference,
      plan,
      billingPeriod,
    })
  } catch (error) {
    console.error("[Setup Plan API] Unexpected error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
