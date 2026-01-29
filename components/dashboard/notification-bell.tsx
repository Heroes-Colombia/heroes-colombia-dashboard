"use client"

import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DashboardWarning } from "@/lib/types"

interface NotificationBellProps {
  warnings: DashboardWarning[]
  className?: string
}

/**
 * Notification bell component that shows warning count and navigates
 * to the highest priority warning page when clicked
 */
export function NotificationBell({ warnings, className }: NotificationBellProps) {
  const router = useRouter()
  const warningCount = warnings.length
  const highestPriorityWarning = warnings.length > 0 ? warnings[0] : null

  const handleClick = () => {
    if (highestPriorityWarning) {
      router.push(highestPriorityWarning.href)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative", className)}
      onClick={handleClick}
      disabled={warningCount === 0}
      aria-label={
        warningCount > 0
          ? `${warningCount} notificaciones pendientes`
          : "Sin notificaciones"
      }
    >
      <Bell className="h-5 w-5" />
      {warningCount > 0 && (
        <span
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
          aria-hidden="true"
        >
          {warningCount > 9 ? "9+" : warningCount}
        </span>
      )}
    </Button>
  )
}

interface NotificationBellWithDataProps {
  businessId: string
  className?: string
}

/**
 * Self-contained notification bell that fetches its own data
 * For use in layouts where warning data isn't readily available
 */
export function NotificationBellWithData({
  businessId,
  className,
}: NotificationBellWithDataProps) {
  // Note: This component requires the parent to pass warnings
  // The actual data fetching happens at the page level
  // This is just a placeholder for future implementation
  return (
    <Button variant="ghost" size="icon" className={cn("relative", className)}>
      <Bell className="h-5 w-5" />
    </Button>
  )
}
