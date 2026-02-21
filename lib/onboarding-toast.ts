import { toast } from "sonner"

export type OnboardingStepId = "locations" | "promotions" | "phone_number" | "featured_image" | "description" | "website"

const STEP_MESSAGES: Record<OnboardingStepId, { title: string; required: boolean }> = {
  locations: { title: "Ubicacion agregada", required: true },
  promotions: { title: "Promocion creada", required: true },
  phone_number: { title: "Telefono agregado", required: true },
  featured_image: { title: "Imagen destacada subida", required: true },
  description: { title: "Descripcion agregada", required: false },
  website: { title: "Sitio web agregado", required: false },
}

/**
 * Show a toast notification when an onboarding step is completed
 * @param stepId - The ID of the completed step
 * @param completedCount - Current number of completed steps
 * @param totalCount - Total number of steps
 */
export function showOnboardingStepToast(
  stepId: OnboardingStepId,
  completedCount: number,
  totalCount: number
) {
  const stepInfo = STEP_MESSAGES[stepId]
  if (!stepInfo) return

  const progressText = `${completedCount} de ${totalCount} pasos completados`
  const isAllComplete = completedCount === totalCount

  if (isAllComplete) {
    toast.success("Perfil completo!", {
      description: "Has completado todos los pasos de tu perfil",
    })
  } else {
    toast.success(stepInfo.title, {
      description: progressText,
    })
  }
}

/**
 * Check if a step was just completed (value went from falsy to truthy)
 */
export function wasStepJustCompleted(previousValue: any, currentValue: any): boolean {
  const wasMissing = !previousValue || (typeof previousValue === "string" && previousValue.trim() === "")
  const isNowPresent = !!currentValue && (typeof currentValue !== "string" || currentValue.trim() !== "")
  return wasMissing && isNowPresent
}
