// Heroes Colombia Dashboard - Data Validation Schemas
// Zod schemas for form validation and data sanitization

import { z } from "zod"

// ============================================================================
// Base Schemas
// ============================================================================

export const planTypeSchema = z.enum(["gratis", "basico", "pro", "enterprise"])
export const userRoleSchema = z.enum(["business", "admin"])
export const businessPermissionSchema = z.enum(["owner", "manager", "staff"])
export const locationTypeSchema = z.enum(["physical", "online"])
export const promotionTypeSchema = z.enum(["percentage", "fixed", "bogo", "free_shipping", "flash_deal"])
export const promotionStatusSchema = z.enum(["draft", "active", "expired", "suspended"])
export const businessStatusSchema = z.enum(["pending", "approved", "suspended", "rejected"])

// ============================================================================
// Business & Location Validation
// ============================================================================

export const businessHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
})

export const addressSchema = z.object({
  street: z.string().min(1, "Dirección es requerida").max(200),
  city: z.string().min(1, "Ciudad es requerida").max(100),
  state: z.string().min(1, "Departamento es requerido").max(100),
  zipCode: z.string().min(1, "Código postal es requerido").max(20),
  country: z.string().default("Colombia"),
})

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
})

export const onlineContactInfoSchema = z.object({
  phone: z.string().max(20).optional(),
  email: z.string().email("Email inválido").optional(),
  whatsapp: z.string().max(20).optional(),
})

// ============================================================================
// Location Validation
// ============================================================================

export const createLocationSchema = z.object({
  name: z.string().min(1, "Nombre de ubicación es requerido").max(100),
  type: locationTypeSchema,

  // Physical location fields (required when type is physical)
  address: addressSchema.optional(),
  coordinates: coordinatesSchema.optional(),
  businessHours: z.array(businessHoursSchema).max(7).optional(),

  // Online location fields (required when type is online)
  website: z.string().url("URL inválida").optional(),
  deliveryZones: z.array(z.string()).max(50).optional(),
  onlineContactInfo: onlineContactInfoSchema.optional(),
}).refine(
  (data) => {
    if (data.type === "physical") {
      return data.address !== undefined
    }
    if (data.type === "online") {
      return data.website !== undefined || data.onlineContactInfo !== undefined
    }
    return true
  },
  {
    message: "Ubicación física requiere dirección, ubicación online requiere website o información de contacto",
    path: ["type"]
  }
)

export const updateLocationSchema = createLocationSchema.partial()

// ============================================================================
// Team Member Validation
// ============================================================================

export const teamPermissionsSchema = z.object({
  canManagePromotions: z.boolean().default(false),
  canViewAnalytics: z.boolean().default(false),
  canManageRedemptions: z.boolean().default(false),
  canManageTeam: z.boolean().default(false),
  canManageLocations: z.boolean().default(false),
  canViewBilling: z.boolean().default(false),
})

export const inviteTeamMemberSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
  role: businessPermissionSchema,
  permissions: teamPermissionsSchema.partial(),
  name: z.string().min(1, "Nombre es requerido").max(100).optional(),
})

export const updateTeamMemberSchema = z.object({
  role: businessPermissionSchema.optional(),
  permissions: teamPermissionsSchema.partial().optional(),
  isActive: z.boolean().optional(),
})

// ============================================================================
// Promotion Validation
// ============================================================================

export const bogoDetailsSchema = z.object({
  buyQuantity: z.number().min(1, "Cantidad mínima es 1"),
  getQuantity: z.number().min(1, "Cantidad mínima es 1"),
  applicableItems: z.array(z.string()).optional(),
})

export const createPromotionSchema = z.object({
  title: z.string().min(1, "Título es requerido").max(200),
  description: z.string().min(1, "Descripción es requerida").max(1000),
  type: promotionTypeSchema,

  // Value validation depends on type
  value: z.number().min(0),
  originalPrice: z.number().min(0).optional(),

  // BOGO specific
  bogoDetails: bogoDetailsSchema.optional(),

  // Scheduling
  startDate: z.date(),
  endDate: z.date(),

  // Limitations
  maxRedemptions: z.number().min(1).optional(),
  maxRedemptionsPerUser: z.number().min(1).optional(),

  // Targeting
  targetLocations: z.array(z.string()).min(1, "Selecciona al menos una ubicación"),

  // Features
  digitalCardEligible: z.boolean().default(false),
}).refine(
  (data) => data.endDate > data.startDate,
  {
    message: "Fecha de finalización debe ser posterior a la fecha de inicio",
    path: ["endDate"]
  }
).refine(
  (data) => {
    if (data.type === "percentage") {
      return data.value > 0 && data.value <= 100
    }
    if (data.type === "fixed") {
      return data.value > 0
    }
    if (data.type === "bogo") {
      return data.bogoDetails !== undefined
    }
    return true
  },
  {
    message: "Valor inválido para el tipo de promoción seleccionado",
    path: ["value"]
  }
)

export const updatePromotionSchema = createPromotionSchema.partial().extend({
  status: promotionStatusSchema.optional(),
  isActive: z.boolean().optional(),
})

// ============================================================================
// Redemption Validation
// ============================================================================

export const processRedemptionSchema = z.object({
  promotionId: z.string().min(1, "ID de promoción es requerido"),
  userMilitaryId: z.string().min(1, "Cédula militar es requerida").max(50),
  locationId: z.string().optional(),

  // Transaction details
  originalAmount: z.number().min(0).optional(),
  discountAmount: z.number().min(0).optional(),
  finalAmount: z.number().min(0).optional(),

  // Verification
  verificationNotes: z.string().max(500).optional(),
  verificationPhoto: z.string().optional(),

  // Method
  redemptionMethod: z.enum(["manual", "qr_code", "digital_card"]).default("manual"),
}).refine(
  (data) => {
    if (data.originalAmount && data.discountAmount && data.finalAmount) {
      return data.finalAmount === data.originalAmount - data.discountAmount
    }
    return true
  },
  {
    message: "Los montos de la transacción no coinciden",
    path: ["finalAmount"]
  }
)

// ============================================================================
// Business Profile Validation
// ============================================================================

export const notificationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  promotions: z.boolean().default(true),
  billing: z.boolean().default(true),
  systemUpdates: z.boolean().default(true),
})

export const createBusinessSchema = z.object({
  businessName: z.string().min(1, "Nombre del negocio es requerido").max(200),
  nit: z.string().min(1, "NIT es requerido").max(20),
  email: z.string().email("Email inválido").toLowerCase(),
  phone: z.string().min(1, "Teléfono es requerido").max(20),
  category: z.string().min(1, "Categoría es requerida").max(100),
  description: z.string().min(1, "Descripción es requerida").max(1000),
  website: z.string().url("URL inválida").optional(),
  billingEmail: z.string().email("Email de facturación inválido").optional(),
  notificationPreferences: notificationPreferencesSchema.optional(),
})

export const updateBusinessSchema = createBusinessSchema.partial().extend({
  plan: planTypeSchema.optional(),
  status: businessStatusSchema.optional(),
  featuredHighlighting: z.boolean().optional(),
  logo: z.string().optional(),
})

// ============================================================================
// User Registration & Authentication
// ============================================================================

export const registerBusinessSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
  password: z.string().min(8, "Contraseña debe tener mínimo 8 caracteres").max(128),
  confirmPassword: z.string(),
  businessName: z.string().min(1, "Nombre del negocio es requerido").max(200),
  nit: z.string().min(1, "NIT es requerido").max(20),
  phone: z.string().min(1, "Teléfono es requerido").max(20),
  category: z.string().min(1, "Categoría es requerida").max(100),
  description: z.string().min(1, "Descripción es requerida").max(1000),
  acceptTerms: z.boolean().refine((val) => val === true, "Debes aceptar los términos y condiciones"),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
  }
)

export const loginSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
  password: z.string().min(1, "Contraseña es requerida"),
  role: userRoleSchema,
})

export const resetPasswordSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Contraseña actual es requerida"),
  newPassword: z.string().min(8, "Nueva contraseña debe tener mínimo 8 caracteres").max(128),
  confirmPassword: z.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"]
  }
)

// ============================================================================
// Search & Filter Validation
// ============================================================================

export const searchPromotionsSchema = z.object({
  query: z.string().max(200).optional(),
  status: z.array(promotionStatusSchema).optional(),
  type: z.array(promotionTypeSchema).optional(),
  locationIds: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(["createdAt", "startDate", "endDate", "title", "redemptions"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

export const searchRedemptionsSchema = z.object({
  query: z.string().max(200).optional(),
  promotionIds: z.array(z.string()).optional(),
  locationIds: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  status: z.array(z.enum(["completed", "pending", "cancelled"])).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(["redeemedAt", "createdAt", "finalAmount"]).default("redeemedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

// ============================================================================
// Analytics & Reporting Validation
// ============================================================================

export const analyticsDateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  compareWith: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }).optional(),
}).refine(
  (data) => data.endDate >= data.startDate,
  {
    message: "Fecha de finalización debe ser igual o posterior a la fecha de inicio",
    path: ["endDate"]
  }
)

export const exportDataSchema = z.object({
  type: z.enum(["promotions", "redemptions", "analytics", "team"]),
  format: z.enum(["csv", "xlsx", "pdf"]).default("csv"),
  filters: z.record(z.unknown()).optional(),
  dateRange: analyticsDateRangeSchema.optional(),
})

// ============================================================================
// Plan & Billing Validation
// ============================================================================

export const planConfigurationSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().min(0),
  currency: z.literal("COP"),
  billingCycle: z.enum(["monthly", "annual"]),
  maxLocations: z.union([z.number().min(1), z.literal("unlimited")]),
  maxPromotions: z.union([z.number().min(1), z.literal("unlimited")]),
  maxTeamMembers: z.union([z.number().min(1), z.literal("unlimited")]),
  analyticsLevel: z.enum(["basic", "advanced", "enterprise"]),
  supportLevel: z.enum(["email", "email_chat", "dedicated"]),
  isActive: z.boolean().default(true),
})

export const upgradePlanSchema = z.object({
  newPlan: planTypeSchema,
  billingCycle: z.enum(["monthly", "annual"]).default("monthly"),
  paymentMethodId: z.string().optional(),
})

// ============================================================================
// File Upload Validation
// ============================================================================

export const fileUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileSize: z.number().min(1).max(10 * 1024 * 1024), // 10MB max
  fileType: z.string().refine(
    (type) => ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(type),
    "Tipo de archivo no permitido"
  ),
  category: z.enum(["logo", "verification", "promotion", "profile"]),
})

// ============================================================================
// Admin Validation Schemas
// ============================================================================

export const approveBusinessSchema = z.object({
  businessId: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
  notes: z.string().max(1000).optional(),
  assignedPlan: planTypeSchema.optional(),
})

export const moderatePromotionSchema = z.object({
  promotionId: z.string().min(1),
  action: z.enum(["approve", "reject", "suspend"]),
  reason: z.string().min(1, "Razón es requerida").max(500),
  moderatorNotes: z.string().max(1000).optional(),
})

export const systemSettingsSchema = z.object({
  platformName: z.string().min(1).max(100),
  maintenanceMode: z.boolean(),
  autoApproveBusinesses: z.boolean(),
  autoApprovePromotions: z.boolean(),
  maxPromotionDuration: z.number().min(1).max(365),
})

// ============================================================================
// Type inference for forms
// ============================================================================

export type CreateLocationForm = z.infer<typeof createLocationSchema>
export type InviteTeamMemberForm = z.infer<typeof inviteTeamMemberSchema>
export type CreatePromotionForm = z.infer<typeof createPromotionSchema>
export type ProcessRedemptionForm = z.infer<typeof processRedemptionSchema>
export type RegisterBusinessForm = z.infer<typeof registerBusinessSchema>
export type LoginForm = z.infer<typeof loginSchema>
export type SearchPromotionsForm = z.infer<typeof searchPromotionsSchema>
export type AnalyticsDateRangeForm = z.infer<typeof analyticsDateRangeSchema>