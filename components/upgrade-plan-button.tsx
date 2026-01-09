"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Sparkles } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PlanType } from "@/lib/types"

interface UpgradePlanButtonProps extends Omit<ButtonProps, "onClick"> {
  currentPlan: PlanType
  targetPlan?: PlanType
  feature?: string
  showIcon?: boolean
  fullWidth?: boolean
}

/**
 * Upgrade Plan Button Component
 *
 * Displays a call-to-action button that directs users to upgrade their plan.
 * Can be customized with different styles, target plans, and feature descriptions.
 *
 * @example
 * // Basic upgrade button
 * <UpgradePlanButton currentPlan="basico" />
 *
 * @example
 * // Upgrade to specific plan with feature context
 * <UpgradePlanButton
 *   currentPlan="basico"
 *   targetPlan="pro"
 *   feature="per-location analytics"
 * />
 */
export function UpgradePlanButton({
  currentPlan,
  targetPlan,
  feature,
  showIcon = true,
  fullWidth = false,
  variant = "default",
  size = "default",
  className,
  children,
  ...props
}: UpgradePlanButtonProps) {
  const router = useRouter()

  // Determine the recommended target plan if not specified
  const recommendedTargetPlan = React.useMemo(() => {
    if (targetPlan) return targetPlan

    // Upgrade path logic
    switch (currentPlan) {
      case "basico":
        return "pro"
      case "pro":
        return "enterprise"
      default:
        return "enterprise"
    }
  }, [currentPlan, targetPlan])

  // Generate button text
  const buttonText = React.useMemo(() => {
    if (children) return children

    if (feature) {
      return `Upgrade for ${feature}`
    }

    const planNames: Record<PlanType, string> = {
      basico: "Básico",
      pro: "Pro",
      enterprise: "Enterprise",
    }

    return `Upgrade to ${planNames[recommendedTargetPlan]}`
  }, [children, feature, recommendedTargetPlan])

  const handleUpgrade = () => {
    // Navigate to plan selection page with query params
    const params = new URLSearchParams({
      from: currentPlan,
      ...(targetPlan && { target: targetPlan }),
      ...(feature && { feature }),
    })

    router.push(`/business/dashboard/plans?${params.toString()}`)
  }

  // Use sparkles icon for basic users (highlight upgrade opportunity)
  const Icon = currentPlan === "basico" ? Sparkles : ArrowUpRight

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleUpgrade}
      className={cn(fullWidth && "w-full", className)}
      {...props}
    >
      {buttonText}
      {showIcon && <Icon className="ml-1" />}
    </Button>
  )
}

/**
 * Compact Upgrade Link Component
 *
 * A subtle text-based upgrade link for inline use within descriptions
 *
 * @example
 * <p>
 *   This feature is only available on higher plans.{" "}
 *   <UpgradePlanLink currentPlan="basico" targetPlan="pro" />
 * </p>
 */
export function UpgradePlanLink({
  currentPlan,
  targetPlan,
  className,
}: {
  currentPlan: PlanType
  targetPlan?: PlanType
  className?: string
}) {
  return (
    <UpgradePlanButton
      currentPlan={currentPlan}
      targetPlan={targetPlan}
      variant="link"
      size="sm"
      showIcon={false}
      className={cn("h-auto p-0 text-sm", className)}
    >
      Upgrade now
    </UpgradePlanButton>
  )
}
