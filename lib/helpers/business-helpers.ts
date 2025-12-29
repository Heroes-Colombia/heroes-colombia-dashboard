import type { BusinessHours } from "../types"
import { LocationService } from "../services/location-service"
import { PromotionService } from "../services/promotion-service"

/**
 * Format business hours for display
 * Groups consecutive days with same hours
 * Example: "Lun-Vie: 9:00 AM - 6:00 PM"
 */
export function formatBusinessHours(hours: BusinessHours[]): string[] {
  if (!hours || hours.length === 0) {
    return ["No hay horario configurado"]
  }

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

  // Sort by day of week
  const sortedHours = [...hours].sort((a, b) => a.day_of_week - b.day_of_week)

  const formatted: string[] = []
  let i = 0

  while (i < sortedHours.length) {
    const current = sortedHours[i]

    if (!current.is_open) {
      formatted.push(`${dayNames[current.day_of_week]}: Cerrado`)
      i++
      continue
    }

    // Find consecutive days with same hours
    const startDay = current.day_of_week
    let endDay = startDay
    const openTime = current.open_time || ""
    const closeTime = current.close_time || ""

    // Look ahead for consecutive days with same hours
    while (
      i + 1 < sortedHours.length &&
      sortedHours[i + 1].day_of_week === endDay + 1 &&
      sortedHours[i + 1].is_open &&
      sortedHours[i + 1].open_time === openTime &&
      sortedHours[i + 1].close_time === closeTime
    ) {
      endDay++
      i++
    }

    // Format time range
    const timeRange = formatTimeRange(openTime, closeTime)

    if (startDay === endDay) {
      formatted.push(`${dayNames[startDay]}: ${timeRange}`)
    } else {
      formatted.push(`${dayNames[startDay]}-${dayNames[endDay]}: ${timeRange}`)
    }

    i++
  }

  return formatted
}

/**
 * Format time from HH:mm to 12-hour format
 */
function formatTimeRange(openTime: string, closeTime: string): string {
  if (!openTime || !closeTime) {
    return "Horario no especificado"
  }

  const formatTime = (time: string): string => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const displayHours = hours % 12 || 12
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`
  }

  return `${formatTime(openTime)} - ${formatTime(closeTime)}`
}

/**
 * Get resource counts for a business
 * Returns counts of locations, active promotions, and team members
 */
export async function getResourceCounts(businessId: string): Promise<{
  locations: number
  activePromotions: number
  teamMembers: number
}> {
  try {
    // Fetch locations count
    const locations = await LocationService.getBusinessLocations(businessId)
    const locationsCount = locations.length

    // Fetch active promotions count
    const activePromotionsCount = await PromotionService.countActivePromotions(businessId)

    // TODO: Add team members count when service is available
    // For now, return 0
    const teamMembersCount = 0

    return {
      locations: locationsCount,
      activePromotions: activePromotionsCount,
      teamMembers: teamMembersCount,
    }
  } catch (error) {
    console.error("Error getting resource counts:", error)
    return {
      locations: 0,
      activePromotions: 0,
      teamMembers: 0,
    }
  }
}

/**
 * Format date to local date string
 */
export function formatDate(date: Date | { seconds: number } | undefined | null): string {
  if (!date) return "N/A"

  try {
    if (typeof date === "object" && "seconds" in date) {
      return new Date(date.seconds * 1000).toLocaleDateString("es-CO")
    }
    return new Date(date).toLocaleDateString("es-CO")
  } catch {
    return "N/A"
  }
}

/**
 * Format date to local date and time string
 */
export function formatDateTime(date: Date | { seconds: number } | undefined | null): string {
  if (!date) return "N/A"

  try {
    if (typeof date === "object" && "seconds" in date) {
      return new Date(date.seconds * 1000).toLocaleString("es-CO")
    }
    return new Date(date).toLocaleString("es-CO")
  } catch {
    return "N/A"
  }
}
