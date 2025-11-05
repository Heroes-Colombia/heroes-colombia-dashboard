/**
 * Promotion status configuration
 */

export const PROMOTION_STATUS_CONFIG = {
  active: {
    variant: "default" as const,
    label: "Activa",
  },
  inactive: {
    variant: "destructive" as const,
    label: "Inactiva",
  },
  expired: {
    variant: "destructive" as const,
    label: "Expirada",
  },
} as const

export type PromotionStatusKey = keyof typeof PROMOTION_STATUS_CONFIG
