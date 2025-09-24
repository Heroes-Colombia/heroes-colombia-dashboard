// Wompi Payment Gateway Integration for Heroes Colombia
// This file handles payment processing with Wompi API

interface PaymentData {
  amount: number
  currency: string
  reference: string
  description: string
  customerEmail: string
  redirectUrl: string
}

interface WompiResponse {
  success: boolean
  transactionId?: string
  paymentUrl?: string
  error?: string
}

// Client-side utility functions that don't expose sensitive data
export const getPaymentPlans = () => {
  return {
    basico: { amount: 49900, name: "Plan Básico Heroes Colombia" },
    pro: { amount: 99900, name: "Plan Pro Heroes Colombia" },
    enterprise: { amount: 199900, name: "Plan Enterprise Heroes Colombia" },
  }
}

export const generatePaymentReference = (planId: string): string => {
  return `HEROES-${planId.toUpperCase()}-${Date.now()}`
}

export type { PaymentData, WompiResponse }
