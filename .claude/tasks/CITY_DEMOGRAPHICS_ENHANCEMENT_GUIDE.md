# City Demographics Enhancement Guide
## Dashboard Analytics - City Demographics Improvements

**Timeline**: 2-3 hours
**Priority**: 🔴 Critical (Bug Fix) + 🟡 High (UX Improvements)
**Developer**: Solo
**Estimated Effort**: 2-3 hours total

---

## Overview

This guide provides step-by-step instructions to enhance the city demographics feature in the Heroes Colombia Dashboard. The current implementation has a critical bug and lacks advanced visualizations.

**Current State:**
- ✅ City data is tracked in `analytics_events` collection
- ✅ Dashboard displays basic city list (top 5)
- ❌ **CRITICAL BUG**: Only shows admin users (filters `where("user_rank", "==", "admin")`)
- ❌ Limited visualization (text list only)
- ❌ No percentage breakdowns
- ❌ No trends or comparisons

**Target State:**
- ✅ Shows all consumer users (fix admin filter)
- ✅ Count unique users (not event count)
- ✅ Display top 10 cities (not just 5)
- ✅ Bar chart visualization
- ✅ Percentage breakdowns
- ✅ Trend indicators (future enhancement)

---

## Phase 1: Critical Bug Fix (5 minutes)

### Issue
The analytics service is filtering to ONLY show admin users, excluding all consumer data.

**File**: `lib/services/analytics-service.ts`
**Lines**: 31

### Current Code (WRONG):
```typescript
static async getAnalyticsEvents(
  businessId: string,
  options?: { ... }
): Promise<FirebaseAnalyticsEvent[]> {
  try {
    const eventsRef = collection(db, "analytics_events")
    let q = query(eventsRef, where("business_id", "==", businessId))
    q = query(q, where("user_rank", "==", "admin"))  // ❌ BUG: Only admins!

    // ... rest of code
  }
}
```

### Fixed Code:
```typescript
static async getAnalyticsEvents(
  businessId: string,
  options?: { ... }
): Promise<FirebaseAnalyticsEvent[]> {
  try {
    const eventsRef = collection(db, "analytics_events")
    let q = query(eventsRef, where("business_id", "==", businessId))
    q = query(q, where("user_rank", "!=", "admin"))  // ✅ FIX: Exclude admins, include consumers

    // ... rest of code
  }
}
```

**Alternative (Better - No Filter):**
```typescript
// Remove the user_rank filter entirely - we want ALL users
static async getAnalyticsEvents(
  businessId: string,
  options?: { ... }
): Promise<FirebaseAnalyticsEvent[]> {
  try {
    const eventsRef = collection(db, "analytics_events")
    let q = query(eventsRef, where("business_id", "==", businessId))
    // ✅ REMOVED: q = query(q, where("user_rank", "==", "admin"))

    // ... rest of code
  }
}
```

### Testing
1. **Before Fix**: Dashboard shows 0 users or only admin events
2. **After Fix**: Dashboard shows actual consumer analytics
3. **Verify**: Check that city demographics populate with real data

---

## Phase 2: Improve Data Accuracy (30 minutes)

### Task 2.1: Count Unique Users (Not Event Count)

**File**: `lib/analytics-utils.ts`
**Function**: `calculateDemographics()`
**Lines**: 151-189

#### Current Implementation (WRONG):
```typescript
function calculateDemographics(events: FirebaseAnalyticsEvent[]) {
  const cityCounts = new Map<string, number>()

  events.forEach((event) => {
    if (event.user_city) {
      cityCounts.set(event.user_city, (cityCounts.get(event.user_city) || 0) + 1)
      // ❌ This counts EVENTS, not unique users!
    }
  })

  const cities = Array.from(cityCounts.entries())
    .map(([city, users]) => ({ city, users }))
    .slice(0, 5)

  return { age: [], rank, cities }
}
```

**Problem:** If a user from Bogotá views 10 businesses, they're counted as 10 users.

#### Fixed Implementation:
```typescript
function calculateDemographics(events: FirebaseAnalyticsEvent[]) {
  const rankCounts = new Map<string, number>()
  const cityCounts = new Map<string, number>()
  const cityUniqueUsers = new Map<string, Set<string>>() // ✅ NEW: Track unique users
  const cityEventCounts = new Map<string, number>() // ✅ NEW: Track total events

  events.forEach((event) => {
    if (event.user_rank && event.user_rank !== "admin") {
      rankCounts.set(event.user_rank, (rankCounts.get(event.user_rank) || 0) + 1)
    }

    if (event.user_city && event.user_id) {
      // Track unique users per city
      if (!cityUniqueUsers.has(event.user_city)) {
        cityUniqueUsers.set(event.user_city, new Set<string>())
      }
      cityUniqueUsers.get(event.user_city)!.add(event.user_id)

      // Track total events per city
      cityEventCounts.set(
        event.user_city,
        (cityEventCounts.get(event.user_city) || 0) + 1
      )
    }
  })

  // Calculate total unique users across all cities
  const totalUniqueUsers = Array.from(cityUniqueUsers.values())
    .reduce((sum, userSet) => sum + userSet.size, 0)

  // Convert to percentage for ranks
  const totalRankEvents = Array.from(rankCounts.values()).reduce((sum, count) => sum + count, 0)
  const rank = Array.from(rankCounts.entries())
    .map(([rankName, count]) => ({
      rank: formatRankDisplay(rankName),
      value: totalRankEvents > 0 ? Math.round((count / totalRankEvents) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // Build city demographics with enhanced metrics
  const cities = Array.from(cityUniqueUsers.entries())
    .map(([city, userSet]) => {
      const uniqueUsers = userSet.size
      const totalEvents = cityEventCounts.get(city) || 0
      const percentage = totalUniqueUsers > 0
        ? ((uniqueUsers / totalUniqueUsers) * 100).toFixed(1)
        : "0"

      return {
        city,
        users: uniqueUsers, // ✅ CHANGED: Unique users, not event count
        eventCount: totalEvents, // ✅ NEW: Total events for this city
        percentage, // ✅ NEW: Percentage of total users
        avgEventsPerUser: uniqueUsers > 0
          ? (totalEvents / uniqueUsers).toFixed(1)
          : "0", // ✅ NEW: Engagement metric
      }
    })
    .sort((a, b) => b.users - a.users)
    .slice(0, 10) // ✅ CHANGED: Top 10 instead of 5

  return {
    age: [], // Age data not in current schema
    rank,
    cities,
  }
}
```

#### Update TypeScript Types

**File**: `lib/analytics-utils.ts`
**Lines**: 34-42

```typescript
export interface AdvancedAnalytics extends BasicAnalytics {
  conversionRate: number
  revenue: number
  averageRevenuePerRedemption: number
  demographics: {
    age: Array<{ range: string; value: number }>
    rank: Array<{ rank: string; value: number }>
    cities: Array<{
      city: string
      users: number
      eventCount: number // ✅ NEW
      percentage: string // ✅ NEW
      avgEventsPerUser: string // ✅ NEW
    }>
  }
}
```

---

## Phase 3: Enhanced Visualization (1 hour)

### Task 3.1: Add Bar Chart

**File**: `app/business/dashboard/analytics/page.tsx`
**Section**: City Demographics Card (lines 479-500)

#### Current Implementation (Text List Only):
```tsx
<Card>
  <CardHeader>
    <CardTitle>Usuarios por Ciudad</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      {advancedAnalytics?.demographics.cities && advancedAnalytics.demographics.cities.length > 0 ? (
        advancedAnalytics.demographics.cities.map((city, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{city.city}</span>
            </div>
            <span className="text-sm font-medium">{city.users}</span>
          </div>
        ))
      ) : (
        <div className="text-sm text-muted-foreground">No hay datos de ciudades disponibles</div>
      )}
    </div>
  </CardContent>
</Card>
```

#### Enhanced Implementation with Bar Chart:
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Demografía por Ciudad</CardTitle>
        <CardDescription>Top 10 ciudades con mayor engagement</CardDescription>
      </div>
      <Badge variant="outline" className="text-xs">
        {advancedAnalytics?.demographics.cities?.length || 0} ciudades
      </Badge>
    </div>
  </CardHeader>
  <CardContent>
    {advancedAnalytics?.demographics.cities && advancedAnalytics.demographics.cities.length > 0 ? (
      <div className="space-y-6">
        {/* Bar Chart Visualization */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={advancedAnalytics.demographics.cities}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                dataKey="city"
                type="category"
                width={90}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="bg-background border rounded-lg p-3 shadow-lg">
                        <p className="font-semibold text-sm mb-2">{data.city}</p>
                        <div className="space-y-1 text-xs">
                          <p className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Usuarios únicos:</span>
                            <span className="font-medium">{data.users.toLocaleString()}</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-muted-foreground">% del total:</span>
                            <span className="font-medium">{data.percentage}%</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Eventos totales:</span>
                            <span className="font-medium">{data.eventCount.toLocaleString()}</span>
                          </p>
                          <p className="flex justify-between gap-4">
                            <span className="text-muted-foreground">Engagement promedio:</span>
                            <span className="font-medium">{data.avgEventsPerUser} eventos/usuario</span>
                          </p>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="users"
                fill="#7A8B5A"
                radius={[0, 4, 4, 0]}
              >
                {advancedAnalytics.demographics.cities.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? '#7A8B5A' : index < 3 ? '#8B9A6A' : '#9CAA7A'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Table */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold mb-3">Detalle por Ciudad</h4>
          <div className="space-y-2">
            {advancedAnalytics.demographics.cities.map((city, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Rank Badge */}
                  <Badge
                    variant={index === 0 ? "default" : "outline"}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  >
                    {index + 1}
                  </Badge>

                  {/* City Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{city.city}</span>
                      {index < 3 && (
                        <Badge variant="secondary" className="text-xs">
                          Top {index + 1}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                      <span>{city.percentage}% del total</span>
                      <span>•</span>
                      <span>{city.avgEventsPerUser} eventos/usuario</span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="text-right">
                  <div className="text-lg font-bold">{city.users.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">usuarios</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div className="h-[300px] flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">No hay datos de ciudades disponibles</p>
          <p className="text-xs text-muted-foreground mt-1">
            Los datos aparecerán cuando los usuarios interactúen con tu negocio
          </p>
        </div>
      </div>
    )}
  </CardContent>
</Card>
```

---

## Phase 4: Future Enhancements (Optional)

### Task 4.1: Add Trend Indicators

**Requires:** Historical data tracking (store previous period's data)

```typescript
// Calculate trends by comparing to previous period
interface CityWithTrend extends City {
  trend: number // Percentage change from previous period
  trendDirection: 'up' | 'down' | 'stable'
}

function calculateCityTrends(
  currentPeriodEvents: FirebaseAnalyticsEvent[],
  previousPeriodEvents: FirebaseAnalyticsEvent[]
): CityWithTrend[] {
  const currentCities = calculateDemographics(currentPeriodEvents).cities
  const previousCities = calculateDemographics(previousPeriodEvents).cities

  return currentCities.map(currentCity => {
    const previousCity = previousCities.find(c => c.city === currentCity.city)

    if (!previousCity) {
      return { ...currentCity, trend: 100, trendDirection: 'up' }
    }

    const change = ((currentCity.users - previousCity.users) / previousCity.users) * 100

    return {
      ...currentCity,
      trend: Math.abs(change),
      trendDirection: change > 5 ? 'up' : change < -5 ? 'down' : 'stable'
    }
  })
}
```

**UI Component:**
```tsx
<div className="flex items-center gap-1">
  <span className="text-lg font-bold">{city.users.toLocaleString()}</span>
  {city.trendDirection === 'up' && (
    <div className="flex items-center text-green-600 text-xs">
      <TrendingUp className="h-3 w-3" />
      <span>{city.trend.toFixed(0)}%</span>
    </div>
  )}
  {city.trendDirection === 'down' && (
    <div className="flex items-center text-red-600 text-xs">
      <TrendingDown className="h-3 w-3" />
      <span>{city.trend.toFixed(0)}%</span>
    </div>
  )}
</div>
```

---

### Task 4.2: City Comparison View

**Purpose:** Compare top cities head-to-head

```tsx
<Card>
  <CardHeader>
    <CardTitle>Comparación entre Ciudades</CardTitle>
    <CardDescription>Métricas clave comparadas</CardDescription>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={cityComparisonData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="metric" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Radar
          name="Bogotá"
          dataKey="bogota"
          stroke="#7A8B5A"
          fill="#7A8B5A"
          fillOpacity={0.6}
        />
        <Radar
          name="Medellín"
          dataKey="medellin"
          stroke="#1E3A8A"
          fill="#1E3A8A"
          fillOpacity={0.6}
        />
        <Legend />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

**Data Structure:**
```typescript
const cityComparisonData = [
  { metric: 'Usuarios', bogota: 85, medellin: 65 },
  { metric: 'Engagement', bogota: 75, medellin: 80 },
  { metric: 'Conversión', bogota: 70, medellin: 75 },
  { metric: 'Retención', bogota: 80, medellin: 70 },
  { metric: 'Frecuencia', bogota: 90, medellin: 60 },
]
```

---

### Task 4.3: CSV Export

**Purpose:** Allow businesses to download city demographics

```typescript
function exportCityDemographics(cities: City[]) {
  const headers = [
    'Ciudad',
    'Usuarios Únicos',
    '% del Total',
    'Eventos Totales',
    'Engagement Promedio'
  ]

  const rows = cities.map(city => [
    city.city,
    city.users.toString(),
    `${city.percentage}%`,
    city.eventCount.toString(),
    city.avgEventsPerUser
  ])

  const csv = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `demografia-ciudades-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
```

**UI Button:**
```tsx
<Button variant="outline" onClick={() => exportCityDemographics(cities)}>
  <Download className="h-4 w-4 mr-2" />
  Exportar CSV
</Button>
```

---

## Testing Checklist

### Phase 1: Bug Fix
- [ ] **Before**: Dashboard shows 0 users or only admin events
- [ ] **After**: Dashboard shows real consumer analytics
- [ ] **Verify**: City demographics populate with actual data

### Phase 2: Data Accuracy
- [ ] **Unique Users**: User who views 10 businesses = 1 user (not 10)
- [ ] **Event Count**: Correctly shows total events per city
- [ ] **Percentage**: Adds up to 100% across all cities
- [ ] **Engagement**: avgEventsPerUser calculated correctly

### Phase 3: Visualization
- [ ] **Bar Chart**: Renders correctly with all cities
- [ ] **Tooltip**: Shows detailed metrics on hover
- [ ] **Color Gradient**: Top city darker, others lighter
- [ ] **Detailed Table**: Shows all metrics per city
- [ ] **Ranking Badges**: Top 3 cities highlighted
- [ ] **Empty State**: Shows friendly message when no data

---

## Performance Considerations

### Optimization Tips

1. **Memoize Calculations**:
   ```typescript
   const cities = useMemo(() => {
     return calculateDemographics(events).cities
   }, [events])
   ```

2. **Limit Data Fetching**:
   ```typescript
   // Only fetch last 30 days by default
   const dateRange = {
     from: addDays(new Date(), -30),
     to: new Date()
   }
   ```

3. **Paginate Large Datasets**:
   ```typescript
   // If > 50 cities, only show top 10 + pagination
   const displayedCities = cities.slice(0, 10)
   ```

---

## Migration Path

### Step-by-Step Deployment

1. **Week 1: Critical Bug Fix**
   - Fix admin filter in analytics-service.ts
   - Deploy to production
   - Verify data starts populating

2. **Week 2: Data Accuracy**
   - Implement unique user counting
   - Update TypeScript types
   - Test with real data

3. **Week 3: Visualization**
   - Add bar chart component
   - Implement detailed table
   - Test on different screen sizes

4. **Week 4+: Future Enhancements**
   - Add trend indicators (if needed)
   - Implement city comparison (if requested)
   - Add CSV export (if requested)

---

## Files to Modify

| File | Changes | Priority | Time |
|------|---------|----------|------|
| `lib/services/analytics-service.ts` | Fix admin filter | 🔴 Critical | 2 min |
| `lib/analytics-utils.ts` | Count unique users | 🟡 High | 30 min |
| `lib/types.ts` | Update interfaces | 🟡 High | 5 min |
| `app/business/dashboard/analytics/page.tsx` | Add visualizations | 🟢 Medium | 1 hour |

---

## Expected Results

### Before Enhancements:
```
Usuarios por Ciudad
- [Empty or only admin data]
```

### After Enhancements:
```
Demografía por Ciudad (Top 10)

[Bar Chart showing all cities with color gradient]

Detalle por Ciudad:
1️⃣ Bogotá         1,234 usuarios (45.2%) • 3.5 eventos/usuario
2️⃣ Medellín       856 usuarios (31.4%) • 4.1 eventos/usuario
3️⃣ Cali           423 usuarios (15.5%) • 2.8 eventos/usuario
...
```

---

## Questions & Support

Need help with:
- Recharts integration?
- Data calculation logic?
- TypeScript type errors?
- Performance optimization?

**Let me know and I'll provide detailed guidance! 🚀**

---

**Last Updated:** January 20, 2025
**Status:** ✅ Ready for Implementation
**Estimated Total Time:** 2-3 hours
