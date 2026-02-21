import { NextRequest, NextResponse } from "next/server"
import { sendTrialAdminEmail } from "@/lib/email"

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.heroescolombia.com"

interface CreateTrialPreferenceBody {
  businessId: string
  businessName: string
  email: string
  phone?: string
}

interface MercadoPagoPreference {
  id: string
  init_point: string
  sandbox_init_point: string
}

/**
 * Create a MercadoPago checkout preference for trial payment (one-time, 20,000 COP)
 *
 * Flow:
 * 1. Business registers in dashboard
 * 2. Dashboard calls this API with businessId
 * 3. API creates MercadoPago preference with external_reference = trial_{businessId}_{timestamp}
 * 4. API returns checkout URL
 * 5. Business completes payment
 * 6. MercadoPago sends webhook notification
 * 7. Webhook handler activates trial (see webhook/route.ts)
 */
export async function POST(req: NextRequest) {
  try {
    const body: CreateTrialPreferenceBody = await req.json()
    const { businessId, businessName, email, phone } = body

    // Validate required fields
    if (!businessId || !businessName || !email) {
      return NextResponse.json(
        { error: "businessId, businessName y email son requeridos" },
        { status: 400 }
      )
    }

    // Build external_reference for tracking
    // Format: trial_{businessId}_{timestamp}
    const timestamp = Date.now()
    const externalReference = `trial_${businessId}_${timestamp}`

    // Create MercadoPago preference for one-time payment
    const preferenceData = {
      items: [
        {
          id: `trial_${businessId}`,
          title: "Prueba Heroes Colombia - 2 meses",
          description: "Período de prueba de 2 meses con acceso a todas las funcionalidades Enterprise",
          quantity: 1,
          currency_id: "COP",
          unit_price: 20000,
        },
      ],
      payer: {
        email: email,
      },
      external_reference: externalReference,
      back_urls: {
        success: `${APP_URL}/business/dashboard?payment=success&type=trial`,
        failure: `${APP_URL}/business/dashboard?payment=failure&type=trial`,
        pending: `${APP_URL}/business/dashboard?payment=pending&type=trial`,
      },
      auto_return: "approved",
      notification_url: `${APP_URL}/api/mercadopago/webhook`,
      statement_descriptor: "Heroes Colombia",
      metadata: {
        business_id: businessId,
        business_name: businessName,
        payment_type: "trial",
        email: email,
      },
    }

    // Call MercadoPago Preferences API
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferenceData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Create Trial Preference] MercadoPago API error:", errorText)
      return NextResponse.json(
        { error: "Error al crear preferencia de pago en MercadoPago" },
        { status: 500 }
      )
    }

    const preference: MercadoPagoPreference = await response.json()

    console.log("[Create Trial Preference] Preference created:", {
      preferenceId: preference.id,
      businessId,
      businessName,
      email,
      externalReference,
    })

    // Send notification email to admin
    try {
      await sendTrialAdminEmail({
        businessName,
        email,
        phone,
      })
    } catch (emailError) {
      console.error("[Create Trial Preference] Error sending admin email:", emailError)
      // Don't fail the request for email errors
    }

    // Return checkout URL
    // In production, use init_point. In sandbox/development, use sandbox_init_point
    const isProduction = process.env.NODE_ENV === "production"
    const checkoutUrl = isProduction ? preference.init_point : preference.sandbox_init_point

    return NextResponse.json({
      success: true,
      checkoutUrl,
      preferenceId: preference.id,
      externalReference,
    })
  } catch (error) {
    console.error("[Create Trial Preference] Unexpected error:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
