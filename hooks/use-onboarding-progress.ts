"use client"

import { useMemo } from "react"
import { MapPin, Tag, Phone, Image, FileText, Globe, type LucideIcon } from "lucide-react"
import type { BusinessProfile, Promotion, BusinessLocation } from "@/lib/types"

export interface OnboardingStep {
  id: string
  label: string
  description: string
  completed: boolean
  required: boolean
  href: string
  icon: LucideIcon
}

export interface OnboardingProgress {
  steps: OnboardingStep[]
  requiredSteps: OnboardingStep[]
  optionalSteps: OnboardingStep[]
  completedCount: number
  totalCount: number
  requiredCompletedCount: number
  requiredTotalCount: number
  progressPercentage: number
  isComplete: boolean // All required steps done
  isFullyComplete: boolean // All steps done (including optional)
  shouldShowCard: boolean
  isNewBusiness: boolean // Business created within 30 days
}

const NEW_BUSINESS_THRESHOLD_DAYS = 30

interface UseOnboardingProgressOptions {
  business: BusinessProfile | null
  promotions: Promotion[]
  locations: BusinessLocation[]
}

/**
 * Hook for computing onboarding progress
 * Tracks required and optional steps for business profile completion
 */
export function useOnboardingProgress(options: UseOnboardingProgressOptions): OnboardingProgress {
  const { business, promotions, locations } = options

  const progress = useMemo<OnboardingProgress>(() => {
    if (!business) {
      return {
        steps: [],
        requiredSteps: [],
        optionalSteps: [],
        completedCount: 0,
        totalCount: 0,
        requiredCompletedCount: 0,
        requiredTotalCount: 0,
        progressPercentage: 0,
        isComplete: false,
        isFullyComplete: false,
        shouldShowCard: false,
        isNewBusiness: false,
      }
    }

    const now = new Date()

    // Check if business is new (created within threshold days)
    let isNewBusiness = false
    if (business.created_at) {
      let createdDate: Date
      if (typeof business.created_at === "object" && "seconds" in business.created_at) {
        createdDate = new Date((business.created_at as any).seconds * 1000)
      } else {
        createdDate = new Date(business.created_at)
      }
      const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      isNewBusiness = daysSinceCreation <= NEW_BUSINESS_THRESHOLD_DAYS
    }

    // Check for ANY promotions (existence, not active status)
    const hasPromotions = promotions.length > 0

    // Build steps list
    const steps: OnboardingStep[] = [
      // Required steps
      {
        id: "locations",
        label: "Agregar ubicacion",
        description: "Agrega al menos una ubicacion para que los usuarios puedan encontrarte",
        completed: locations.length > 0,
        required: true,
        href: "/business/dashboard/locations",
        icon: MapPin,
      },
      {
        id: "promotions",
        label: "Crear promocion",
        description: "Crea tu primera promocion para atraer clientes",
        completed: hasPromotions,
        required: true,
        href: "/business/dashboard/promotions",
        icon: Tag,
      },
      {
        id: "phone_number",
        label: "Agregar telefono",
        description: "Agrega un numero de telefono para que los clientes puedan contactarte",
        completed: !!business.phone_number && business.phone_number.trim() !== "",
        required: true,
        href: "/business/dashboard/settings",
        icon: Phone,
      },
      {
        id: "featured_image",
        label: "Subir imagen destacada",
        description: "Sube una imagen que represente tu negocio",
        completed: !!business.featured_image,
        required: true,
        href: "/business/dashboard/settings",
        icon: Image,
      },
      // Optional steps
      {
        id: "description",
        label: "Agregar descripcion",
        description: "Una buena descripcion ayuda a los clientes a conocer tu negocio",
        completed: !!business.description && business.description.trim() !== "",
        required: false,
        href: "/business/dashboard/settings",
        icon: FileText,
      },
    ]

    // Add website step only for non-physical businesses
    if (business.type !== "physical") {
      steps.push({
        id: "website",
        label: "Agregar sitio web",
        description: "Conecta tu sitio web para que los clientes puedan visitarlo",
        completed: !!business.website && business.website.trim() !== "",
        required: false,
        href: "/business/dashboard/settings",
        icon: Globe,
      })
    }

    const requiredSteps = steps.filter((s) => s.required)
    const optionalSteps = steps.filter((s) => !s.required)

    const completedCount = steps.filter((s) => s.completed).length
    const totalCount = steps.length
    const requiredCompletedCount = requiredSteps.filter((s) => s.completed).length
    const requiredTotalCount = requiredSteps.length

    const isComplete = requiredCompletedCount === requiredTotalCount
    const isFullyComplete = completedCount === totalCount
    const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    // Show card if not fully complete
    const shouldShowCard = !isFullyComplete

    return {
      steps,
      requiredSteps,
      optionalSteps,
      completedCount,
      totalCount,
      requiredCompletedCount,
      requiredTotalCount,
      progressPercentage,
      isComplete,
      isFullyComplete,
      shouldShowCard,
      isNewBusiness,
    }
  }, [business, promotions, locations])

  return progress
}

/**
 * Check if onboarding is complete (all required fields filled)
 * Utility function for use outside of React components
 */
export function checkOnboardingComplete(
  business: BusinessProfile | null,
  promotions: Promotion[],
  locations: BusinessLocation[]
): boolean {
  if (!business) return false

  // Check for at least one promotion (any status)
  const hasPromotions = promotions.length > 0
  const hasLocations = locations.length > 0
  const hasPhoneNumber = !!business.phone_number && business.phone_number.trim() !== ""
  const hasFeaturedImage = !!business.featured_image

  return hasLocations && hasPromotions && hasPhoneNumber && hasFeaturedImage
}
