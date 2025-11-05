/**
 * Form validation utilities
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validates promotion form data
 */
export function validatePromotionForm(data: {
  title: string
  description: string
  instructions: string
  percentage: number
  expiredAt: Date
}): ValidationResult {
  if (!data.title.trim()) {
    return { isValid: false, error: "El título es requerido" }
  }

  if (data.title.length < 3 || data.title.length > 100) {
    return { isValid: false, error: "El título debe tener entre 3 y 100 caracteres" }
  }

  if (!data.description.trim()) {
    return { isValid: false, error: "La descripción es requerida" }
  }

  if (data.description.length < 10) {
    return { isValid: false, error: "La descripción debe tener al menos 10 caracteres" }
  }

  if (!data.instructions.trim()) {
    return { isValid: false, error: "Las instrucciones son requeridas" }
  }

  if (data.percentage < 1 || data.percentage > 100) {
    return { isValid: false, error: "El porcentaje debe estar entre 1 y 100" }
  }

  if (data.expiredAt <= new Date()) {
    return { isValid: false, error: "La fecha de expiración debe ser futura" }
  }

  return { isValid: true }
}

/**
 * Clamps a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
