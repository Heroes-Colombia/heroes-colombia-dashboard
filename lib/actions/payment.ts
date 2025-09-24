"use server"

import type { PaymentData, WompiResponse } from "@/lib/wompi"

interface WompiConfig {
  publicKey: string
  privateKey: string
  environment: "sandbox" | "production"
}

class WompiService {
  private config: WompiConfig

  constructor(config: WompiConfig) {
    this.config = config
  }

  private getBaseUrl(): string {
    return this.config.environment === "production" ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1"
  }

  async createPaymentLink(paymentData: PaymentData): Promise<WompiResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/payment_links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.privateKey}`,
        },
        body: JSON.stringify({
          name: paymentData.description,
          description: paymentData.description,
          single_use: true,
          collect_shipping: false,
          currency: paymentData.currency,
          amount_in_cents: paymentData.amount * 100, // Wompi expects cents
          redirect_url: paymentData.redirectUrl,
          reference: paymentData.reference,
          customer_email: paymentData.customerEmail,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: true,
          transactionId: data.data.id,
          paymentUrl: data.data.permalink,
        }
      } else {
        return {
          success: false,
          error: data.error?.messages?.join(", ") || "Error creating payment link",
        }
      }
    } catch (error) {
      return {
        success: false,
        error: "Network error occurred",
      }
    }
  }

  async verifyTransaction(transactionId: string): Promise<WompiResponse> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/transactions/${transactionId}`, {
        headers: {
          Authorization: `Bearer ${this.config.privateKey}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        return {
          success: data.data.status === "APPROVED",
          transactionId: data.data.id,
        }
      } else {
        return {
          success: false,
          error: "Transaction verification failed",
        }
      }
    } catch (error) {
      return {
        success: false,
        error: "Network error occurred",
      }
    }
  }
}

// Initialize Wompi service with server-side environment variables
const wompiService = new WompiService({
  publicKey: process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "pub_test_default",
  privateKey: process.env.WOMPI_PRIVATE_KEY || "prv_test_default",
  environment: process.env.NODE_ENV === "production" ? "production" : "sandbox",
})

export async function createSubscriptionPayment(planId: string, customerEmail: string): Promise<WompiResponse> {
  const plans = {
    basico: { amount: 49900, name: "Plan Básico Heroes Colombia" },
    pro: { amount: 99900, name: "Plan Pro Heroes Colombia" },
    enterprise: { amount: 199900, name: "Plan Enterprise Heroes Colombia" },
  }

  const plan = plans[planId as keyof typeof plans]
  if (!plan) {
    return { success: false, error: "Invalid plan selected" }
  }

  const paymentData: PaymentData = {
    amount: plan.amount,
    currency: "COP",
    reference: `HEROES-${planId.toUpperCase()}-${Date.now()}`,
    description: plan.name,
    customerEmail,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/business/dashboard/billing?status=success`,
  }

  return await wompiService.createPaymentLink(paymentData)
}

export async function verifyPaymentTransaction(transactionId: string): Promise<WompiResponse> {
  return await wompiService.verifyTransaction(transactionId)
}
