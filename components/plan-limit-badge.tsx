"use client"

import * as React from "react"
import { AlertCircle, CheckCircle, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getPlanLimits } from "@/lib/plan-limits"
import type { PlanType } from "@/lib/types"

interface PlanLimitBadgeProps {
  plan: PlanType
  resourceType: "locations" | "promotions" | "users"
  currentCount: number
  extraPurchased?: number // For extra promotions
  className?: string
  showIcon?: boolean
  showDetails?: boolean
}

/**
 * Plan Limit Badge Component
 *
 * Displays the current usage vs. limit for a specific resource,
 * with visual indicators for usage status (safe, warning, at limit).
 *
 * @example
 * // Basic usage for locations
 * <PlanLimitBadge
 *   plan="basico"
 *   resourceType="locations"
 *   currentCount={2}
 * />
 *
 * @example
 * // Promotions with extra purchased
 * <PlanLimitBadge
 *   plan="basico"
 *   resourceType="promotions"
 *   currentCount={5}
 *   extraPurchased={2}
 *   showDetails
 * />
 *
 * @example
 * // Users at limit
 * <PlanLimitBadge
 *   plan="gratis"
 *   resourceType="users"
 *   currentCount={1}
 *   showIcon
 * />
 */
export function PlanLimitBadge({
  plan,
  resourceType,
  currentCount,
  extraPurchased = 0,
  className,
  showIcon = true,
  showDetails = false,
}: PlanLimitBadgeProps) {
  const limits = getPlanLimits(plan)

  // Calculate effective limit
  const { limit, hasLimit, displayLimit } = React.useMemo(() => {
    let baseLimit: number | null

    switch (resourceType) {
      case "locations":
        baseLimit = limits.maxLocations === Infinity ? null : limits.maxLocations
        break
      case "promotions":
        baseLimit = limits.maxActivePromotions
        break
      case "users":
        baseLimit = limits.maxUsers === Infinity ? null : limits.maxUsers
        break
    }

    // Add extra promotions to limit if applicable
    const effectiveLimit =
      resourceType === "promotions" && baseLimit !== null
        ? baseLimit + extraPurchased
        : baseLimit

    return {
      limit: effectiveLimit,
      hasLimit: effectiveLimit !== null,
      displayLimit: effectiveLimit === null ? "∞" : effectiveLimit.toString(),
    }
  }, [limits, resourceType, extraPurchased])

  // Determine usage status
  const status = React.useMemo(() => {
    if (!hasLimit) return "unlimited"
    if (limit === null) return "unlimited"

    const usagePercent = (currentCount / limit) * 100

    if (currentCount >= limit) return "at-limit"
    if (usagePercent >= 80) return "warning"
    return "safe"
  }, [currentCount, limit, hasLimit])

  // Get badge variant and icon
  const { variant, Icon } = React.useMemo(() => {
    switch (status) {
      case "at-limit":
        return {
          variant: "destructive" as const,
          Icon: AlertCircle,
        }
      case "warning":
        return {
          variant: "outline" as const,
          Icon: Info,
        }
      case "unlimited":
        return {
          variant: "secondary" as const,
          Icon: CheckCircle,
        }
      case "safe":
      default:
        return {
          variant: "outline" as const,
          Icon: CheckCircle,
        }
    }
  }, [status])

  // Resource label
  const resourceLabel = React.useMemo(() => {
    switch (resourceType) {
      case "locations":
        return currentCount === 1 ? "location" : "locations"
      case "promotions":
        return currentCount === 1 ? "promotion" : "promotions"
      case "users":
        return currentCount === 1 ? "user" : "users"
    }
  }, [resourceType, currentCount])

  // Badge text
  const badgeText = showDetails
    ? `${currentCount} / ${displayLimit} ${resourceLabel}`
    : `${currentCount} / ${displayLimit}`

  return (
    <Badge
      variant={variant}
      className={cn(
        "font-mono tabular-nums",
        status === "at-limit" && "animate-pulse",
        className
      )}
    >
      {showIcon && <Icon className="mr-1" />}
      {badgeText}
      {extraPurchased > 0 && resourceType === "promotions" && (
        <span className="ml-1 text-[10px] opacity-70">(+{extraPurchased})</span>
      )}
    </Badge>
  )
}

/**
 * Plan Limit Progress Component
 *
 * Visual progress bar showing usage towards limit
 */
export function PlanLimitProgress({
  plan,
  resourceType,
  currentCount,
  extraPurchased = 0,
  className,
}: Omit<PlanLimitBadgeProps, "showIcon" | "showDetails">) {
  const limits = getPlanLimits(plan)

  const { limit, percentage } = React.useMemo(() => {
    let baseLimit: number | null

    switch (resourceType) {
      case "locations":
        baseLimit = limits.maxLocations === Infinity ? null : limits.maxLocations
        break
      case "promotions":
        baseLimit = limits.maxActivePromotions
        break
      case "users":
        baseLimit = limits.maxUsers === Infinity ? null : limits.maxUsers
        break
    }

    // Add extra promotions to limit if applicable
    const effectiveLimit =
      resourceType === "promotions" && baseLimit !== null
        ? baseLimit + extraPurchased
        : baseLimit

    const percent =
      effectiveLimit === null ? 0 : Math.min((currentCount / effectiveLimit) * 100, 100)

    return {
      limit: effectiveLimit,
      percentage: percent,
    }
  }, [limits, resourceType, currentCount, extraPurchased])

  // If unlimited, show checkmark instead of progress
  if (limit === null) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2",
          className
        )}
      >
        <CheckCircle className="size-4 text-green-600 dark:text-green-500" />
        <span className="text-sm text-muted-foreground">Unlimited {resourceType}</span>
      </div>
    )
  }

  // Determine color based on usage
  const progressColor =
    percentage >= 100
      ? "bg-destructive"
      : percentage >= 80
        ? "bg-yellow-500"
        : "bg-primary"

  const resourceLabel =
    resourceType === "locations"
      ? currentCount === 1
        ? "location"
        : "locations"
      : resourceType === "promotions"
        ? currentCount === 1
          ? "promotion"
          : "promotions"
        : currentCount === 1
          ? "user"
          : "users"

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground capitalize">{resourceType}</span>
        <span className="font-mono font-medium tabular-nums">
          {currentCount} / {limit}
          {extraPurchased > 0 && resourceType === "promotions" && (
            <span className="ml-1 text-xs opacity-60">(+{extraPurchased} extra)</span>
          )}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full transition-all duration-300",
            progressColor,
            percentage >= 100 && "animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {percentage >= 80 && (
        <p className="text-xs text-muted-foreground">
          {percentage >= 100 ? (
            <>You've reached your limit for {resourceLabel}</>
          ) : (
            <>You're approaching your limit for {resourceLabel}</>
          )}
        </p>
      )}
    </div>
  )
}
