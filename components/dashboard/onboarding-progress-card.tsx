"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Check, ChevronRight, Sparkles, PartyPopper } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { OnboardingProgress, OnboardingStep } from "@/hooks/use-onboarding-progress"

interface OnboardingProgressCardProps {
  mode: "onboarding" | "optimization"
  progress: OnboardingProgress
  onComplete?: () => void
  className?: string
}

const CONTENT = {
  onboarding: {
    title: "Completa tu perfil para aparecer en la app",
    subtitle: "Tu negocio sera visible cuando completes los pasos requeridos",
    badgeLabel: "Pendiente",
    badgeVariant: "secondary" as const,
    celebrationTitle: "Felicidades, tu negocio esta listo!",
    celebrationSubtitle: "Tu negocio ahora es visible para todos los usuarios de Heroes Colombia",
  },
  optimization: {
    title: "Optimiza tu perfil de negocio",
    subtitle: "Un perfil completo genera mas confianza y visibilidad",
    badgeLabel: null, // No badge for optimization mode
    badgeVariant: null,
    celebrationTitle: "Perfil completo!",
    celebrationSubtitle: "Tu perfil esta optimizado para atraer mas clientes",
  },
}

function StepItem({ step, isLast }: { step: OnboardingStep; isLast: boolean }) {
  const Icon = step.icon

  return (
    <Link href={step.href} className="block group">
      <div
        className={cn(
          "flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg transition-colors",
          step.completed
            ? "hover:bg-green-50"
            : "hover:bg-gray-50"
        )}
      >
        {/* Icon/Checkmark */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            step.completed
              ? "bg-green-100 text-green-600"
              : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
          )}
        >
          {step.completed ? (
            <Check className="w-4 h-4" />
          ) : (
            <Icon className="w-4 h-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                step.completed ? "text-green-700" : "text-gray-900"
              )}
            >
              {step.label}
            </span>
            {step.required && !step.completed && (
              <span className="text-xs text-orange-600 font-medium">
                Requerido
              </span>
            )}
            {!step.required && !step.completed && (
              <span className="text-xs text-gray-400">
                Opcional
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
            {step.description}
          </p>
        </div>

        {/* Arrow */}
        {!step.completed && (
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>

      {/* Divider */}
      {!isLast && (
        <div className="ml-4 border-l-2 border-dashed border-gray-200 h-2" />
      )}
    </Link>
  )
}

function CelebrationState({ mode }: { mode: "onboarding" | "optimization" }) {
  const content = CONTENT[mode]

  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
        <PartyPopper className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        {content.celebrationTitle}
      </h3>
      <p className="text-sm text-gray-600">
        {content.celebrationSubtitle}
      </p>
    </div>
  )
}

export function OnboardingProgressCard({
  mode,
  progress,
  onComplete,
  className,
}: OnboardingProgressCardProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const [wasPreviouslyIncomplete, setWasPreviouslyIncomplete] = useState(true)

  const content = CONTENT[mode]

  // Track when progress becomes complete to show celebration
  useEffect(() => {
    if (progress.isFullyComplete && wasPreviouslyIncomplete) {
      setShowCelebration(true)
      onComplete?.()
      // Hide celebration after 5 seconds
      const timer = setTimeout(() => {
        setShowCelebration(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
    if (!progress.isFullyComplete) {
      setWasPreviouslyIncomplete(true)
    }
  }, [progress.isFullyComplete, wasPreviouslyIncomplete, onComplete])

  // Don't render if fully complete and not showing celebration
  if (progress.isFullyComplete && !showCelebration) {
    return null
  }

  // Show celebration state
  if (showCelebration) {
    return (
      <div
        className={cn(
          "rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6",
          className
        )}
      >
        <CelebrationState mode={mode} />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {content.title}
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {content.subtitle}
              </p>
            </div>
          </div>

          {/* Status badge - only in onboarding mode */}
          {mode === "onboarding" && content.badgeLabel && (
            <Badge variant={content.badgeVariant} className="flex-shrink-0 bg-orange-100 text-orange-700 border-orange-200">
              {content.badgeLabel}
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              {progress.completedCount} de {progress.totalCount} completados
            </span>
            <span className="text-sm font-semibold text-blue-600">
              {progress.progressPercentage}%
            </span>
          </div>
          <Progress value={progress.progressPercentage} className="h-2" />
        </div>
      </div>

      {/* Steps list */}
      <div className="p-4">
        {/* Required steps */}
        {progress.requiredSteps.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Pasos requeridos
            </h4>
            <div>
              {progress.requiredSteps.map((step, index) => (
                <StepItem
                  key={step.id}
                  step={step}
                  isLast={index === progress.requiredSteps.length - 1}
                />
              ))}
            </div>
          </div>
        )}

        {/* Optional steps */}
        {progress.optionalSteps.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Pasos opcionales
            </h4>
            <div>
              {progress.optionalSteps.map((step, index) => (
                <StepItem
                  key={step.id}
                  step={step}
                  isLast={index === progress.optionalSteps.length - 1}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer message for onboarding mode */}
      {mode === "onboarding" && !progress.isComplete && (
        <div className="px-4 py-3 bg-orange-50 border-t border-orange-100">
          <p className="text-xs text-orange-700">
            Completa los pasos requeridos para que tu negocio aparezca en la app de Heroes Colombia.
          </p>
        </div>
      )}

      {/* Success message when required steps are complete but optional remain */}
      {progress.isComplete && !progress.isFullyComplete && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-100">
          <p className="text-xs text-green-700">
            {mode === "onboarding"
              ? "Tu negocio ya esta activo! Completa los pasos opcionales para mejorar tu visibilidad."
              : "Completa los pasos opcionales para maximizar tu visibilidad."}
          </p>
        </div>
      )}
    </div>
  )
}
