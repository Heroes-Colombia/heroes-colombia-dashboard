/**
 * Mercado Pago Subscription Plan IDs
 *
 * These are the preapproval_plan_id values created in Mercado Pago
 * for each plan and billing period combination.
 *
 * Trial periods configured in Mercado Pago:
 * - Monthly plans: 14 days free trial
 * - Annual plans: 60 days free trial
 */

import type { PlanType, BillingPeriod } from "@/lib/types"

export interface MercadoPagoPlanConfig {
  planId: string
  trialDays: number
}

export const MERCADOPAGO_PLAN_IDS: Record<PlanType, Record<BillingPeriod, MercadoPagoPlanConfig>> = {
  fundador: {
    monthly: {
      planId: "6a6f36d2a89b4b0b9c42fa826c918011",
      trialDays: 0,
    },
    annual: {
      planId: "25bd64cb44384867aa11e4c832cc04d7",
      trialDays: 0,
    },
  },
  basico: {
    monthly: {
      planId: "0865edb241804d71b91cca47d5638a56",
      trialDays: 14,
    },
    annual: {
      planId: "29d44165cf67441f93b192bdee10c617",
      trialDays: 60,
    },
  },
  pro: {
    monthly: {
      planId: "857c97b66a0a4ca5a58eced23ba480c2",
      trialDays: 14,
    },
    annual: {
      planId: "0945f7ac125744ac8a20880fa8b98817",
      trialDays: 60,
    },
  },
  enterprise: {
    monthly: {
      planId: "c7eeec755c304a44b31d508be4169e6c",
      trialDays: 14,
    },
    annual: {
      planId: "689ef84cdfd7478fa0a78086c34da785",
      trialDays: 60,
    },
  },
}

/**
 * Get Mercado Pago plan configuration for a given plan and billing period
 */
export function getMercadoPagoPlanConfig(
  plan: PlanType,
  billingPeriod: BillingPeriod
): MercadoPagoPlanConfig {
  return MERCADOPAGO_PLAN_IDS[plan][billingPeriod]
}

/**
 * Get Mercado Pago plan ID for a given plan and billing period
 */
export function getMercadoPagoPlanId(
  plan: PlanType,
  billingPeriod: BillingPeriod
): string {
  return MERCADOPAGO_PLAN_IDS[plan][billingPeriod].planId
}

/**
 * Get plan details from a Mercado Pago plan ID (reverse lookup)
 */
export function getPlanFromMercadoPagoId(
  planId: string
): { plan: PlanType; billingPeriod: BillingPeriod } | null {
  for (const [plan, periods] of Object.entries(MERCADOPAGO_PLAN_IDS)) {
    for (const [period, config] of Object.entries(periods)) {
      if (config.planId === planId) {
        return {
          plan: plan as PlanType,
          billingPeriod: period as BillingPeriod,
        }
      }
    }
  }
  return null
}
