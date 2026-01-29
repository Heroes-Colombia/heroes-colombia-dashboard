"use client"

import Link from "next/link"
import { AlertTriangle, MapPin, Tag, Clock, User, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DashboardWarning, WarningType } from "@/lib/types"

interface WarningCardProps {
  warning: DashboardWarning
  className?: string
}

const warningConfig: Record<WarningType, {
  Icon: typeof AlertTriangle
  iconColor: string
  bgColor: string
  borderColor: string
}> = {
  no_locations: {
    Icon: MapPin,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  no_promotions: {
    Icon: Tag,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  expired_promotions: {
    Icon: Clock,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  incomplete_profile: {
    Icon: User,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
}

export function WarningCard({ warning, className }: WarningCardProps) {
  const config = warningConfig[warning.type]
  const { Icon, iconColor, bgColor, borderColor } = config

  return (
    <Link href={warning.href} className="block">
      <div
        className={cn(
          "group relative flex items-start gap-4 rounded-lg border p-4 transition-all hover:shadow-md",
          bgColor,
          borderColor,
          className
        )}
      >
        <div className={cn("mt-0.5 flex-shrink-0", iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">{warning.title}</h4>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {warning.description}
          </p>
        </div>
        <div className="flex-shrink-0 self-center opacity-0 transition-opacity group-hover:opacity-100">
          <ChevronRight className="h-5 w-5 text-gray-400" />
        </div>
      </div>
    </Link>
  )
}

interface WarningCardsListProps {
  warnings: DashboardWarning[]
  className?: string
  maxItems?: number
}

export function WarningCardsList({ warnings, className, maxItems }: WarningCardsListProps) {
  if (warnings.length === 0) return null

  const displayedWarnings = maxItems ? warnings.slice(0, maxItems) : warnings

  return (
    <div className={cn("space-y-3", className)}>
      {displayedWarnings.map((warning) => (
        <WarningCard key={warning.id} warning={warning} />
      ))}
    </div>
  )
}

interface WarningsSectionProps {
  warnings: DashboardWarning[]
  title?: string
  className?: string
}

export function WarningsSection({ warnings, title = "Acciones Pendientes", className }: WarningsSectionProps) {
  if (warnings.length === 0) return null

  return (
    <div className={cn("rounded-lg border border-gray-200 bg-white p-4", className)}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-yellow-600" />
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <span className="ml-auto inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
          {warnings.length}
        </span>
      </div>
      <WarningCardsList warnings={warnings} />
    </div>
  )
}
