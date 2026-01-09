/**
 * Heroes Colombia - Analytics Utilities
 *
 * This file provides analytics calculation functions for the dashboard.
 * Supports three tiers of analytics based on business plan:
 *
 * 1. Basic Analytics (Básico & Pro): Simple counts from promotions
 * 2. Advanced Analytics (Pro): Demographics, conversion rates, per-location
 * 3. Enterprise Analytics: Cohorts, heatmaps, benchmarking
 *
 * DATA SOURCES:
 * - Promotions collection: views_count, saves_count, redemptions_count (denormalized)
 * - analytics_events collection: Detailed event tracking (required for Pro+ features)
 *
 * MOBILE APP REQUIREMENTS:
 * The Flutter app must track events to populate analytics_events collection.
 * See: heroesapp/.claude/tasks/ANALYTICS_EVENT_TRACKING_GUIDE.md
 */

import type { Promotion, FirebaseAnalyticsEvent, PlanType, BusinessLocation } from "@/lib/types"

// ============================================================================
// Analytics Types
// ============================================================================

export interface BasicAnalytics {
  impressions: number
  views: number
  saves: number
  promotionSaves: number
  redemptions: number
  linkClicks: {
    navigation: number
    website: number
    phone: number
    whatsapp: number
  }
}

export interface AdvancedAnalytics extends BasicAnalytics {
  conversionRate: number
  revenue: number
  averageRevenuePerRedemption: number
  demographics: {
    age: Array<{ range: string; value: number }> // V3: Age range distribution
    sex: Array<{ sex: string; value: number }> // V3: Gender distribution
    rank: Array<{ rank: string; value: number }>
    cities: Array<{ city: string; users: number }>
  }
}

export interface EnterpriseAnalytics extends AdvancedAnalytics {
  heatmaps: Array<{ page: string; clicks: number; time: number }>
  cohorts: Array<{ month: string; retention: number }>
}

export interface FunnelData {
  name: string
  value: number
  fill: string
}

export interface LocationAnalyticsData {
  location: string
  locationId: string
  impressions: number
  views: number
  saves: number
  redemptions: number
}

export interface TimeSeriesDataPoint {
  date: string
  impressions: number
  views: number
  saves: number
  redemptions: number
  revenue: number
}

// ============================================================================
// Basic Analytics (All Plans - Básico, Pro, Enterprise)
// ============================================================================

/**
 * Calculate basic analytics from promotions
 * Available to: All plans
 * Data source: Denormalized counts in promotions collection
 */
export function calculatePromotionAnalytics(events: FirebaseAnalyticsEvent[], promotion: Promotion) {
  return {
    views: events.filter((e) => e.event_type === "view" && e.entity_id === promotion.id && e.entity_type === "promotion").length || 0,
    promotionSaves: events.filter((e) => e.event_type === "save" && e.entity_id === promotion.id && e.entity_type === "promotion").length || 0,
  }
}

/**
 * Extract link clicks from event metadata
 * Counts clicks by link_type: navigation, website, phone, whatsapp
 */
function calculateLinkClicks(events: FirebaseAnalyticsEvent[]): {
  navigation: number
  website: number
  phone: number
  whatsapp: number
} {
  const linkClicks = {
    navigation: 0,
    website: 0,
    phone: 0,
    whatsapp: 0,
  }

  events
    .filter((e) => e.event_type === "click" && e.metadata?.link_type)
    .forEach((event) => {
      const linkType = event.metadata?.link_type
      if (linkType === "navigation") linkClicks.navigation++
      else if (linkType === "website") linkClicks.website++
      else if (linkType === "phone") linkClicks.phone++
      else if (linkType === "whatsapp") linkClicks.whatsapp++
    })

  return linkClicks
}

/**
 * Calculate basic analytics from analytics_events collection
 * More accurate than denormalized counts, but requires querying events
 */
export function calculateBasicAnalyticsFromEvents(
  events: FirebaseAnalyticsEvent[]
): BasicAnalytics {
  return {
    impressions: events.filter((e) => e.event_type === "impression").length || 0,
    views: events.filter((e) => e.event_type === "view" && e.entity_type === "business").length || 0,
    saves: events.filter((e) => e.event_type === "save" && e.entity_type === "business").length || 0,
    promotionSaves: events.filter((e) => e.event_type === "save" && e.entity_type === "promotion").length || 0,
    redemptions: events.filter((e) => e.event_type === "redemption").length || 0,
    linkClicks: calculateLinkClicks(events),
  }
}

// ============================================================================
// Advanced Analytics (Pro & Enterprise Plans)
// ============================================================================

/**
 * Calculate advanced analytics from promotions and events
 * Available to: Pro, Enterprise plans
 * Requires: analytics_events collection data
 *
 * @param promotions - Array of promotions
 * @param events - Analytics events for demographics (required for Pro+)
 * @param estimatedRevenue - Estimated revenue from redemptions (optional)
 */
export function calculateAdvancedAnalytics(
  events: FirebaseAnalyticsEvent[],
  estimatedRevenue?: number
): AdvancedAnalytics {
  const analytics = calculateBasicAnalyticsFromEvents(events)

  const conversionRate = analytics.views > 0 ? (analytics.redemptions / analytics.views) * 100 : 0
  const revenue = estimatedRevenue || 0
  const averageRevenuePerRedemption = analytics.redemptions > 0 ? revenue / analytics.redemptions : 0

  const demographics = calculateDemographics(events)

  return {
    ...analytics,
    conversionRate,
    revenue,
    averageRevenuePerRedemption,
    demographics,
  }
}

/**
 * Calculate demographics from analytics events
 * Groups users by age range, sex, military rank, and city
 * Data source: user_age_range, user_sex, user_rank, and user_city fields in analytics_events (V3)
 */
function calculateDemographics(events: FirebaseAnalyticsEvent[]) {
  const ageCounts = new Map<string, number>()
  const sexCounts = new Map<string, number>()
  const rankCounts = new Map<string, number>()
  const cityCounts = new Map<string, number>()
  const uniqueUsers = new Set<string>()

  events.forEach((event) => {
    if (event.user_id) {
      uniqueUsers.add(event.user_id)
    }

    // V3: Age range demographics
    if (event.user_age_range) {
      ageCounts.set(event.user_age_range, (ageCounts.get(event.user_age_range) || 0) + 1)
    }

    // V3: Sex demographics
    if (event.user_sex) {
      sexCounts.set(event.user_sex, (sexCounts.get(event.user_sex) || 0) + 1)
    }

    if (event.user_rank && event.user_rank != "admin") {
      rankCounts.set(event.user_rank, (rankCounts.get(event.user_rank) || 0) + 1)
    }
    if (event.user_city && event.user_city != 'Surfers Paradise' && event.user_city != 'Burleigh Heads') {
      cityCounts.set(event.user_city, (cityCounts.get(event.user_city) || 0) + 1)
    }
  })

  // Convert to percentage for age ranges
  const totalAgeEvents = Array.from(ageCounts.values()).reduce((sum, count) => sum + count, 0)
  const age = Array.from(ageCounts.entries())
    .map(([range, count]) => ({
      range,
      value: totalAgeEvents > 0 ? Math.round((count / totalAgeEvents) * 100) : 0,
    }))
    .sort((a, b) => {
      // Sort by age range order
      const ageOrder = ["18-25", "26-35", "36-45", "46-55", "56-65", "66+", "under-18"]
      return ageOrder.indexOf(a.range) - ageOrder.indexOf(b.range)
    })

  // Convert to percentage for sex
  const totalSexEvents = Array.from(sexCounts.values()).reduce((sum, count) => sum + count, 0)
  const sex = Array.from(sexCounts.entries())
    .map(([gender, count]) => ({
      sex: gender === "male" ? "Masculino" : "Femenino",
      value: totalSexEvents > 0 ? Math.round((count / totalSexEvents) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)

  // Convert to percentage for ranks
  const totalRankEvents = Array.from(rankCounts.values()).reduce((sum, count) => sum + count, 0)
  const rank = Array.from(rankCounts.entries())
    .map(([rankName, count]) => ({
      rank: formatRankDisplay(rankName),
      value: totalRankEvents > 0 ? Math.round((count / totalRankEvents) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // Top 5 cities by user count
  const cities = Array.from(cityCounts.entries())
    .map(([city, users]) => ({ city, users }))
    .sort((a, b) => b.users - a.users)
    .slice(0, 5)

  return {
    age,
    sex,
    rank,
    cities,
  }
}

/**
 * Format rank display from database format
 * Example: "ARMY_OFFICER_CAPTAIN" → "Capitán"
 */
function formatRankDisplay(rankCode: string): string {
  // In production, this would map to proper Spanish names
  // For now, return formatted version
  const parts = rankCode.split("_")
  return parts.length > 0 ? parts[parts.length - 1].toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : rankCode
}

// ============================================================================
// Enterprise Analytics (Enterprise Plan Only)
// ============================================================================

/**
 * Calculate enterprise analytics
 * Available to: Enterprise plan only
 * Requires: analytics_events collection data
 */
export function calculateEnterpriseAnalytics(
  promotions: Promotion[],
  events: FirebaseAnalyticsEvent[],
  estimatedRevenue?: number
): EnterpriseAnalytics {
  const advanced = calculateAdvancedAnalytics(events, estimatedRevenue)

  // Calculate heatmaps from events (promotion engagement)
  const heatmaps = calculateHeatmaps(events, promotions)

  // Calculate cohort retention (user engagement over time)
  const cohorts = calculateCohorts(events)

  return {
    ...advanced,
    heatmaps,
    cohorts,
  }
}

/**
 * Calculate heatmap data from events
 * Shows which promotions get most engagement (clicks/views)
 * Data source: events with event_type="view" grouped by entity_id
 */
function calculateHeatmaps(
  events: FirebaseAnalyticsEvent[],
  promotions: Promotion[]
): Array<{ page: string; clicks: number; time: number }> {
  const promotionViews = new Map<string, number>()

  // Count views per promotion
  events
    .filter((e) => (e.event_type === "view" && e.entity_type === "promotion") && e.entity_id)
    .forEach((event) => {
      const promotionDetails = promotions.find((p) => p.id === event.entity_id)
      if (promotionDetails) {
        const current = promotionViews.get(promotionDetails.title) || 0
        promotionViews.set(promotionDetails.title, current + 1)
      }
    })

  // Map to promotion names and sort by engagement
  return Array.from(promotionViews.entries())
    .map(([promotionTitle, clicks]) => {
      return {
        page: promotionTitle,
        clicks,
        time: 0, // Would need time_spent tracking in events metadata
      }
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10)
}

/**
 * Calculate cohort retention analysis
 * Groups users by their first engagement month and tracks retention
 * Data source: events grouped by user_id and sorted by timestamp
 */
function calculateCohorts(
  events: FirebaseAnalyticsEvent[]
): Array<{ month: string; retention: number }> {
  // Group events by user
  const userEvents = new Map<string, FirebaseAnalyticsEvent[]>()

  events.forEach((event) => {
    if (!event.user_id) return

    const userEventsList = userEvents.get(event.user_id) || []
    userEventsList.push(event)
    userEvents.set(event.user_id, userEventsList)
  })

  // Calculate monthly cohorts
  const cohortData = new Map<string, { total: number; retained: number }>()
  const now = new Date()

  userEvents.forEach((userEventsList) => {
    if (userEventsList.length === 0) return

    // Sort events by date
    const sortedEvents = userEventsList.sort((a, b) => {
      const dateA = timestampToDate(a.timestamp)
      const dateB = timestampToDate(b.timestamp)
      return dateA.getTime() - dateB.getTime()
    })

    const firstEvent = sortedEvents[0]
    const firstDate = timestampToDate(firstEvent.timestamp)

    const cohortMonth = firstDate.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    })

    const cohort = cohortData.get(cohortMonth) || { total: 0, retained: 0 }
    cohort.total++

    // Check if user has recent activity (within last 30 days)
    const lastEvent = sortedEvents[sortedEvents.length - 1]
    const lastDate = timestampToDate(lastEvent.timestamp)

    const daysSinceLastActivity = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceLastActivity <= 30) {
      cohort.retained++
    }

    cohortData.set(cohortMonth, cohort)
  })

  // Convert to array with retention percentage
  return Array.from(cohortData.entries())
    .map(([month, data]) => ({
      month,
      retention: data.total > 0 ? Math.round((data.retained / data.total) * 100) : 0,
    }))
    .slice(-6) // Last 6 months
}

// ============================================================================
// Per-Location Analytics (Pro+ Feature)
// ============================================================================

/**
 * Calculate per-location analytics from events
 * Available to: Pro & Enterprise (if perLocationAnalytics flag enabled)
 * Data source: events with location_id field
 */
export function calculateLocationAnalytics(
  events: FirebaseAnalyticsEvent[],
  locations: BusinessLocation[]
): LocationAnalyticsData[] {
  const locationData = new Map<string, { impressions: number; views: number; saves: number; redemptions: number }>()

  events.forEach((event) => {
    if (!event.location_id) return

    const data = locationData.get(event.location_id) || {
      impressions: 0,
      views: 0,
      saves: 0,
      redemptions: 0,
    }

    if (event.event_type === "impression") data.impressions++
    if (event.event_type === "view" && event.entity_type === "business") data.views++
    if (event.event_type === "save" && event.entity_type === "business") data.saves++
    if (event.event_type === "redemption") data.redemptions++

    locationData.set(event.location_id, data)
  })

  return Array.from(locationData.entries()).map(([locationId, data]) => {
    const location = locations.find((l) => l.id === locationId)
    return {
      location: location?.name || `Ubicación ${locationId.slice(0, 8)}`,
      locationId,
      ...data,
    }
  })
}

// ============================================================================
// Time Series Analytics
// ============================================================================

/**
 * Calculate time series data from events
 * Groups events by date within the date range
 * Data source: events with timestamp field
 */
export function calculateTimeSeriesData(
  events: FirebaseAnalyticsEvent[],
  dateRange: { from: Date; to: Date },
  estimatedRevenuePerRedemption: number = 0
): TimeSeriesDataPoint[] {
  // Group events by date
  const dateData = new Map<string, { impressions: number; views: number; saves: number; redemptions: number }>()

  events.forEach((event) => {
    const eventDate = timestampToDate(event.timestamp)
    const dateKey = eventDate.toISOString().split("T")[0] // YYYY-MM-DD

    const data = dateData.get(dateKey) || {
      impressions: 0,
      views: 0,
      saves: 0,
      redemptions: 0,
    }

    if (event.event_type === "impression") data.impressions++
    if (event.event_type === "view" && event.entity_type === "business") data.views++
    if (event.event_type === "save" && event.entity_type === "business") data.saves++
    if (event.event_type === "redemption") data.redemptions++

    dateData.set(dateKey, data)
  })

  // Convert to array and fill missing dates
  const result: TimeSeriesDataPoint[] = []
  const currentDate = new Date(dateRange.from)

  while (currentDate <= dateRange.to) {
    const dateKey = currentDate.toISOString().split("T")[0]
    const data = dateData.get(dateKey) || {
      impressions: 0,
      views: 0,
      saves: 0,
      redemptions: 0,
    }

    result.push({
      date: currentDate.toLocaleDateString("es-CO", { month: "2-digit", day: "2-digit" }),
      ...data,
      revenue: data.redemptions * estimatedRevenuePerRedemption,
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return result
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get analytics based on plan level
 * Automatically returns the appropriate analytics tier
 */
export function getAnalyticsByPlan(
  plan: PlanType,
  promotions: Promotion[],
  events: FirebaseAnalyticsEvent[],
  options?: {
    estimatedRevenue?: number
  }
): BasicAnalytics | AdvancedAnalytics | EnterpriseAnalytics {
  if (plan === "enterprise" && events && events.length > 0) {
    return calculateEnterpriseAnalytics(promotions, events, options?.estimatedRevenue)
  } else if ((plan === "pro" || plan === "basico") && events && events.length > 0) {
    return calculateAdvancedAnalytics(events, options?.estimatedRevenue)
  } else {
    return calculateBasicAnalyticsFromEvents(events)
  }
}

/**
 * Calculate funnel conversion data
 */
export function calculateFunnelData(events: FirebaseAnalyticsEvent[]): FunnelData[] {
  const metrics = calculateBasicAnalyticsFromEvents(events)

  return [
    { name: "Impresiones", value: metrics.impressions, fill: "#7A8B5A" },
    { name: "Vistas", value: metrics.views, fill: "#1E3A8A" },
    { name: "Guardadas", value: metrics.saves, fill: "#059669" },
  ]
}

/**
 * Filter promotions by date range
 */
export function filterPromotionsByDateRange(
  promotions: Promotion[],
  dateRange: { from: Date; to: Date }
): Promotion[] {
  return promotions.filter((promotion) => {
    const createdAt = promotion.created_at
    const promotionDate = timestampToDate(createdAt)
    return promotionDate >= dateRange.from && promotionDate <= dateRange.to
  })
}

/**
 * Filter analytics events by date range
 */
export function filterEventsByDateRange(
  events: FirebaseAnalyticsEvent[],
  dateRange: { from: Date; to: Date }
): FirebaseAnalyticsEvent[] {
  return events.filter((event) => {
    const eventDate = timestampToDate(event.timestamp)
    return eventDate >= dateRange.from && eventDate <= dateRange.to
  })
}

/**
 * Get active promotions count
 */
export function getActivePromotionsCount(promotions: Promotion[]): number {
  return promotions.filter((p) => p.status === "active").length
}

/**
 * Get expired promotions count
 */
export function getExpiredPromotionsCount(promotions: Promotion[]): number {
  const now = new Date()
  return promotions.filter((p) => {
    const expiredAt = timestampToDate(p.expired_at)
    return expiredAt < now
  }).length
}

/**
 * Calculate percentage change compared to previous period
 */
export function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%"
  const change = ((current - previous) / previous) * 100
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`
}

/**
 * Get top performing promotions by views
 */
export function getTopPromotions(promotions: Promotion[], limit: number = 5): Promotion[] {
  return [...promotions]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, limit)
}

/**
 * Check if plan has access to analytics level
 */
export function hasAnalyticsAccess(
  plan: PlanType,
  level: "basic" | "advanced" | "enterprise"
): boolean {
  const planHierarchy: Record<PlanType, number> = {
    basico: 1,
    pro: 2,
    enterprise: 3,
  }

  const levelRequirement: Record<string, number> = {
    basic: 1,
    advanced: 3,
    enterprise: 4,
  }

  return planHierarchy[plan] >= levelRequirement[level]
}

/**
 * Convert Firebase Timestamp to Date
 * Handles both Firestore Timestamp objects and Date objects
 */
function timestampToDate(timestamp: any): Date {
  if (timestamp && typeof timestamp === "object" && "seconds" in timestamp) {
    return new Date(timestamp.seconds * 1000)
  }
  return new Date(timestamp)
}

/**
 * Get empty demographics structure
 */
function getEmptyDemographics() {
  return {
    age: [],
    sex: [],
    rank: [],
    cities: [],
  }
}
