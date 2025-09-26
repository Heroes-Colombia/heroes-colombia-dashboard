// Heroes Colombia Dashboard - Data Export Utilities
// Functions for exporting data to CSV, Excel, and PDF formats

import type {
  BusinessLocation,
  TeamMember,
  Promotion,
  Redemption,
  BusinessAnalytics,
  BusinessProfile
} from "./types"

// ============================================================================
// CSV Export Utilities
// ============================================================================

/**
 * Converts an array of objects to CSV format
 */
export const convertToCSV = (data: any[], headers: Record<string, string>): string => {
  if (data.length === 0) return ""

  // Create header row
  const headerRow = Object.values(headers).join(",")

  // Create data rows
  const dataRows = data.map(item => {
    return Object.keys(headers).map(key => {
      const value = getNestedValue(item, key)

      // Handle different data types
      if (value === null || value === undefined) return '""'
      if (typeof value === "string") return `"${value.replace(/"/g, '""')}"`
      if (typeof value === "number") return value.toString()
      if (typeof value === "boolean") return value ? "Sí" : "No"
      if (value instanceof Date) return `"${formatDateForExport(value)}"`
      if (Array.isArray(value)) return `"${value.join(", ")}"`
      if (typeof value === "object") return `"${JSON.stringify(value).replace(/"/g, '""')}"`

      return `"${String(value).replace(/"/g, '""')}"`
    }).join(",")
  })

  return [headerRow, ...dataRows].join("\n")
}

/**
 * Downloads CSV content as a file
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}_${formatDateForFilename(new Date())}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Exports data directly to CSV
 */
export const exportToCSV = (data: any[], headers: Record<string, string>, filename: string): void => {
  const csvContent = convertToCSV(data, headers)
  downloadCSV(csvContent, filename)
}

// ============================================================================
// Specific Export Functions
// ============================================================================

/**
 * Export business locations to CSV
 */
export const exportLocations = (locations: BusinessLocation[]): void => {
  const headers = {
    name: "Nombre",
    type: "Tipo",
    "address.street": "Dirección",
    "address.city": "Ciudad",
    "address.state": "Departamento",
    "address.zipCode": "Código Postal",
    website: "Sitio Web",
    deliveryZones: "Zonas de Entrega",
    "onlineContactInfo.phone": "Teléfono",
    "onlineContactInfo.email": "Email",
    isActive: "Activo",
    createdAt: "Fecha de Creación",
  }

  exportToCSV(locations, headers, "ubicaciones")
}

/**
 * Export team members to CSV
 */
export const exportTeamMembers = (members: TeamMember[]): void => {
  const headers = {
    name: "Nombre",
    email: "Email",
    role: "Rol",
    invitationStatus: "Estado de Invitación",
    isActive: "Activo",
    "permissions.canManagePromotions": "Gestionar Promociones",
    "permissions.canViewAnalytics": "Ver Analíticas",
    "permissions.canManageRedemptions": "Gestionar Redenciones",
    "permissions.canManageTeam": "Gestionar Equipo",
    "permissions.canManageLocations": "Gestionar Ubicaciones",
    "permissions.canViewBilling": "Ver Facturación",
    invitedAt: "Fecha de Invitación",
    acceptedAt: "Fecha de Aceptación",
  }

  exportToCSV(members, headers, "equipo")
}

/**
 * Export promotions to CSV
 */
export const exportPromotions = (promotions: Promotion[]): void => {
  const headers = {
    title: "Título",
    description: "Descripción",
    type: "Tipo",
    value: "Valor",
    status: "Estado",
    startDate: "Fecha de Inicio",
    endDate: "Fecha de Finalización",
    currentRedemptions: "Redenciones Actuales",
    maxRedemptions: "Redenciones Máximas",
    digitalCardEligible: "Tarjeta Digital",
    isFeatured: "Destacada",
    createdAt: "Fecha de Creación",
  }

  exportToCSV(promotions, headers, "promociones")
}

/**
 * Export redemptions to CSV
 */
export const exportRedemptions = (redemptions: Redemption[]): void => {
  const headers = {
    userMilitaryId: "Cédula Militar",
    userEmail: "Email del Usuario",
    "promotion.title": "Promoción",
    "location.name": "Ubicación",
    redemptionMethod: "Método",
    originalAmount: "Monto Original",
    discountAmount: "Descuento",
    finalAmount: "Monto Final",
    status: "Estado",
    redeemedAt: "Fecha de Redención",
    redeemedBy: "Procesado Por",
    verificationNotes: "Notas de Verificación",
  }

  exportToCSV(redemptions, headers, "redenciones")
}

/**
 * Export business analytics to CSV
 */
export const exportAnalytics = (analytics: BusinessAnalytics[]): void => {
  const headers = {
    periodStart: "Inicio del Período",
    periodEnd: "Fin del Período",
    totalImpressions: "Impresiones Totales",
    totalViews: "Vistas Totales",
    totalRedemptions: "Redenciones Totales",
    conversionRate: "Tasa de Conversión (%)",
    revenueAttributed: "Ingresos Atribuidos",
    calculatedAt: "Calculado En",
  }

  exportToCSV(analytics, headers, "analiticas")
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets nested object value using dot notation
 */
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null
  }, obj)
}

/**
 * Formats date for display in exports
 */
const formatDateForExport = (date: Date): string => {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date)
}

/**
 * Formats date for filename
 */
const formatDateForFilename = (date: Date): string => {
  return date.toISOString().split('T')[0]
}

/**
 * Formats currency values for export
 */
export const formatCurrencyForExport = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formats percentage values for export
 */
export const formatPercentageForExport = (value: number): string => {
  return `${value.toFixed(2)}%`
}

// ============================================================================
// Advanced Export Features
// ============================================================================

/**
 * Export with custom date range filtering
 */
export const exportWithDateRange = <T extends { createdAt: Date | string }>(
  data: T[],
  startDate: Date,
  endDate: Date,
  headers: Record<string, string>,
  filename: string
): void => {
  const filteredData = data.filter(item => {
    const itemDate = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt)
    return itemDate >= startDate && itemDate <= endDate
  })

  exportToCSV(filteredData, headers, `${filename}_${formatDateForFilename(startDate)}_${formatDateForFilename(endDate)}`)
}

/**
 * Export with custom filtering function
 */
export const exportWithFilter = <T>(
  data: T[],
  filterFn: (item: T) => boolean,
  headers: Record<string, string>,
  filename: string
): void => {
  const filteredData = data.filter(filterFn)
  exportToCSV(filteredData, headers, filename)
}

/**
 * Export business summary report
 */
export const exportBusinessSummary = (
  business: BusinessProfile,
  locations: BusinessLocation[],
  promotions: Promotion[],
  redemptions: Redemption[],
  analytics: BusinessAnalytics[]
): void => {
  // Create summary data
  const summaryData = [{
    businessName: business.businessName,
    plan: business.plan,
    status: business.status,
    totalLocations: locations.length,
    activePromotions: promotions.filter(p => p.status === "active").length,
    totalRedemptions: redemptions.length,
    totalRevenue: redemptions.reduce((sum, r) => sum + (r.finalAmount || 0), 0),
    totalDiscounts: redemptions.reduce((sum, r) => sum + (r.discountAmount || 0), 0),
    createdAt: business.createdAt,
    lastActiveAt: business.lastActiveAt,
  }]

  const headers = {
    businessName: "Nombre del Negocio",
    plan: "Plan",
    status: "Estado",
    totalLocations: "Total Ubicaciones",
    activePromotions: "Promociones Activas",
    totalRedemptions: "Total Redenciones",
    totalRevenue: "Ingresos Totales",
    totalDiscounts: "Descuentos Totales",
    createdAt: "Fecha de Creación",
    lastActiveAt: "Última Actividad",
  }

  exportToCSV(summaryData, headers, "resumen_negocio")
}

// ============================================================================
// Batch Export Functions
// ============================================================================

/**
 * Export all business data in separate files
 */
export const exportAllBusinessData = (businessData: {
  locations: BusinessLocation[]
  members: TeamMember[]
  promotions: Promotion[]
  redemptions: Redemption[]
  analytics: BusinessAnalytics[]
}): void => {
  const { locations, members, promotions, redemptions, analytics } = businessData

  // Export each dataset
  if (locations.length > 0) exportLocations(locations)
  if (members.length > 0) exportTeamMembers(members)
  if (promotions.length > 0) exportPromotions(promotions)
  if (redemptions.length > 0) exportRedemptions(redemptions)
  if (analytics.length > 0) exportAnalytics(analytics)
}

// ============================================================================
// Type-specific Export Configurations
// ============================================================================

export const EXPORT_CONFIGS = {
  locations: {
    headers: {
      name: "Nombre",
      type: "Tipo",
      "address.street": "Dirección",
      "address.city": "Ciudad",
      isActive: "Activo",
    },
    filename: "ubicaciones"
  },
  team: {
    headers: {
      name: "Nombre",
      email: "Email",
      role: "Rol",
      invitationStatus: "Estado",
      isActive: "Activo",
    },
    filename: "equipo"
  },
  promotions: {
    headers: {
      title: "Título",
      type: "Tipo",
      value: "Valor",
      status: "Estado",
      currentRedemptions: "Redenciones",
    },
    filename: "promociones"
  },
  redemptions: {
    headers: {
      userMilitaryId: "Cédula Militar",
      "promotion.title": "Promoción",
      finalAmount: "Monto Final",
      status: "Estado",
      redeemedAt: "Fecha",
    },
    filename: "redenciones"
  }
} as const

/**
 * Generic export function using predefined configurations
 */
export const exportData = <T extends keyof typeof EXPORT_CONFIGS>(
  type: T,
  data: any[],
  customFilename?: string
): void => {
  const config = EXPORT_CONFIGS[type]
  const filename = customFilename || config.filename
  exportToCSV(data, config.headers, filename)
}