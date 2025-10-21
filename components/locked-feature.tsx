"use client"

import * as React from "react"
import { Lock, Sparkles, TrendingUp, Users, Zap } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { UpgradePlanButton } from "@/components/upgrade-plan-button"
import { getPlanLimits } from "@/lib/plan-limits"
import type { PlanType } from "@/lib/types"

interface LockedFeatureProps {
  currentPlan: PlanType
  featureName: string
  requiredPlan: PlanType
  description?: string
  benefits?: string[]
  icon?: "lock" | "sparkles" | "trending" | "users" | "zap"
  variant?: "card" | "inline" | "overlay"
  className?: string
  children?: React.ReactNode
}

const ICON_MAP = {
  lock: Lock,
  sparkles: Sparkles,
  trending: TrendingUp,
  users: Users,
  zap: Zap,
}

const PLAN_NAMES: Record<PlanType, string> = {
  gratis: "Gratis",
  basico: "Básico",
  pro: "Pro",
  enterprise: "Enterprise",
}

/**
 * Locked Feature Component
 *
 * Displays a locked feature message with upgrade CTA.
 * Supports multiple display variants: card, inline, and overlay.
 *
 * @example
 * // Card variant for empty state
 * <LockedFeature
 *   currentPlan="gratis"
 *   featureName="Per-Location Analytics"
 *   requiredPlan="pro"
 *   description="See detailed analytics for each of your locations"
 *   benefits={["Track performance by location", "Compare locations", "Optimize your strategy"]}
 * />
 *
 * @example
 * // Inline variant for in-page messaging
 * <LockedFeature
 *   currentPlan="basico"
 *   featureName="Audience Segmentation"
 *   requiredPlan="pro"
 *   variant="inline"
 * />
 *
 * @example
 * // Overlay variant to block disabled UI sections
 * <div className="relative">
 *   <LockedFeature
 *     currentPlan="gratis"
 *     featureName="Team Management"
 *     requiredPlan="basico"
 *     variant="overlay"
 *   />
 *   <div className="opacity-50 pointer-events-none">
 *     [Disabled content here]
 *   </div>
 * </div>
 */
export function LockedFeature({
  currentPlan,
  featureName,
  requiredPlan,
  description,
  benefits,
  icon = "lock",
  variant = "card",
  className,
  children,
}: LockedFeatureProps) {
  const requiredLimits = getPlanLimits(requiredPlan)
  const IconComponent = ICON_MAP[icon]

  // Card variant - Full featured card with benefits list
  if (variant === "card") {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-muted p-2">
              <IconComponent className="size-5 text-muted-foreground" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{featureName}</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {PLAN_NAMES[requiredPlan]}+
                </Badge>
              </div>
              {description && (
                <CardDescription className="text-sm">{description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        {benefits && benefits.length > 0 && (
          <CardContent>
            <ul className="space-y-2">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}

        {children && <CardContent>{children}</CardContent>}

        <CardFooter>
          <UpgradePlanButton
            currentPlan={currentPlan}
            targetPlan={requiredPlan}
            feature={featureName}
            fullWidth
          />
        </CardFooter>
      </Card>
    )
  }

  // Inline variant - Compact message for in-page use
  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-dashed bg-muted/30 p-4",
          className
        )}
      >
        <div className="rounded-md bg-muted p-1.5">
          <IconComponent className="size-4 text-muted-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {featureName} requires {PLAN_NAMES[requiredPlan]}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <UpgradePlanButton
          currentPlan={currentPlan}
          targetPlan={requiredPlan}
          size="sm"
          variant="outline"
        >
          Upgrade
        </UpgradePlanButton>
      </div>
    )
  }

  // Overlay variant - Blocks content with semi-transparent overlay
  if (variant === "overlay") {
    return (
      <div
        className={cn(
          "absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm",
          className
        )}
      >
        <div className="max-w-md space-y-4 p-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
            <IconComponent className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{featureName}</h3>
            <p className="text-sm text-muted-foreground">
              {description || `Available on ${PLAN_NAMES[requiredPlan]} plan and above`}
            </p>
          </div>
          <UpgradePlanButton
            currentPlan={currentPlan}
            targetPlan={requiredPlan}
            feature={featureName}
          />
        </div>
      </div>
    )
  }

  return null
}

/**
 * Feature Gate Component
 *
 * Conditionally renders children based on plan access.
 * If locked, shows LockedFeature component instead.
 *
 * @example
 * <FeatureGate
 *   currentPlan={business.plan}
 *   requiredPlan="pro"
 *   featureName="Advanced Analytics"
 *   lockedVariant="overlay"
 * >
 *   <AdvancedAnalyticsChart />
 * </FeatureGate>
 */
export function FeatureGate({
  currentPlan,
  requiredPlan,
  featureName,
  description,
  lockedVariant = "card",
  children,
}: {
  currentPlan: PlanType
  requiredPlan: PlanType
  featureName: string
  description?: string
  lockedVariant?: "card" | "inline" | "overlay"
  children: React.ReactNode
}) {
  // Plan hierarchy for access check
  const PLAN_HIERARCHY: Record<PlanType, number> = {
    gratis: 0,
    basico: 1,
    pro: 2,
    enterprise: 3,
  }

  const hasAccess = PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan]

  if (hasAccess) {
    return <>{children}</>
  }

  // If using overlay variant, wrap content
  if (lockedVariant === "overlay") {
    return (
      <div className="relative">
        <LockedFeature
          currentPlan={currentPlan}
          featureName={featureName}
          requiredPlan={requiredPlan}
          description={description}
          variant="overlay"
        />
        <div className="pointer-events-none opacity-30">{children}</div>
      </div>
    )
  }

  // For card/inline variants, replace content entirely
  return (
    <LockedFeature
      currentPlan={currentPlan}
      featureName={featureName}
      requiredPlan={requiredPlan}
      description={description}
      variant={lockedVariant}
    />
  )
}

/**
 * Check if a feature is available for a plan
 */
export function hasFeatureAccess(
  currentPlan: PlanType,
  requiredPlan: PlanType
): boolean {
  const PLAN_HIERARCHY: Record<PlanType, number> = {
    gratis: 0,
    basico: 1,
    pro: 2,
    enterprise: 3,
  }

  return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan]
}
