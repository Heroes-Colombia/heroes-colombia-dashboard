// Heroes Colombia Dashboard - Seed Data for Development
// Mock data for testing and development purposes

import type {
  BusinessProfile,
  BusinessLocation,
  TeamMember,
  Promotion,
  Redemption,
  PlanConfiguration,
  SystemSettings,
  BusinessAnalytics
} from "./types"

// ============================================================================
// Plan Configurations
// ============================================================================

export const seedPlanConfigurations: PlanConfiguration[] = [
  {
    id: "gratis",
    name: "Plan Gratis",
    price: 0,
    currency: "COP",
    billingCycle: "monthly",
    maxLocations: 1,
    maxPromotions: 1,
    maxTeamMembers: 1,
    features: {
      basicAnalytics: true,
      advancedAnalytics: false,
      enterpriseAnalytics: false,
      teamManagement: false,
      priorityListings: false,
      featuredPromotions: false,
      apiAccess: false,
      customCampaigns: false,
      dedicatedManager: false,
    },
    analyticsLevel: "basic",
    supportLevel: "email",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "basico",
    name: "Plan Básico",
    price: 60000,
    currency: "COP",
    billingCycle: "monthly",
    maxLocations: 1,
    maxPromotions: 3,
    maxTeamMembers: 3,
    features: {
      basicAnalytics: true,
      advancedAnalytics: false,
      enterpriseAnalytics: false,
      teamManagement: true,
      priorityListings: false,
      featuredPromotions: false,
      apiAccess: false,
      customCampaigns: false,
      dedicatedManager: false,
    },
    analyticsLevel: "basic",
    supportLevel: "email",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "pro",
    name: "Plan Pro",
    price: 230000,
    currency: "COP",
    billingCycle: "monthly",
    maxLocations: 5,
    maxPromotions: "unlimited",
    maxTeamMembers: 10,
    features: {
      basicAnalytics: true,
      advancedAnalytics: true,
      enterpriseAnalytics: false,
      teamManagement: true,
      priorityListings: true,
      featuredPromotions: true,
      apiAccess: false,
      customCampaigns: false,
      dedicatedManager: false,
    },
    analyticsLevel: "advanced",
    supportLevel: "email_chat",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "enterprise",
    name: "Plan Enterprise",
    price: 700000,
    currency: "COP",
    billingCycle: "monthly",
    maxLocations: "unlimited",
    maxPromotions: "unlimited",
    maxTeamMembers: "unlimited",
    features: {
      basicAnalytics: true,
      advancedAnalytics: true,
      enterpriseAnalytics: true,
      teamManagement: true,
      priorityListings: true,
      featuredPromotions: true,
      apiAccess: true,
      customCampaigns: true,
      dedicatedManager: true,
    },
    analyticsLevel: "enterprise",
    supportLevel: "dedicated",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
]

// ============================================================================
// Sample Businesses
// ============================================================================

export const seedBusinesses: BusinessProfile[] = [
  {
    id: "biz_001",
    businessName: "Restaurante El Comandante",
    nit: "900123456-7",
    email: "contacto@elcomandante.com",
    phone: "+57 301 234 5678",
    category: "Restaurante",
    description: "Restaurante especializado en comida típica colombiana con descuentos especiales para personal militar y sus familias.",
    logo: "https://example.com/logos/comandante.png",
    website: "https://www.elcomandante.com",
    plan: "pro",
    planStartDate: new Date("2024-06-01"),
    planEndDate: new Date("2024-07-01"),
    billingEmail: "facturacion@elcomandante.com",
    status: "approved",
    featuredHighlighting: true,
    notificationPreferences: {
      email: true,
      promotions: true,
      billing: true,
      systemUpdates: true,
    },
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-06-20"),
    createdBy: "admin_001",
    lastActiveAt: new Date("2024-06-20"),
  },
  {
    id: "biz_002",
    businessName: "Tienda Militar Bogotá",
    nit: "800987654-3",
    email: "ventas@tiendamilitar.co",
    phone: "+57 310 987 6543",
    category: "Tienda Deportiva",
    description: "Tienda especializada en equipos, uniformes y accesorios militares con precios preferenciales.",
    plan: "basico",
    planStartDate: new Date("2024-05-01"),
    planEndDate: new Date("2024-06-01"),
    status: "approved",
    featuredHighlighting: false,
    notificationPreferences: {
      email: true,
      promotions: true,
      billing: true,
      systemUpdates: false,
    },
    createdAt: new Date("2024-04-20"),
    updatedAt: new Date("2024-06-15"),
    createdBy: "admin_001",
    lastActiveAt: new Date("2024-06-19"),
  },
  {
    id: "biz_003",
    businessName: "Hotel Libertad",
    nit: "900555444-1",
    email: "reservas@hotellibertad.co",
    phone: "+57 320 555 4444",
    category: "Hotel",
    description: "Hotel de 4 estrellas en el centro de Bogotá con tarifas especiales para militares en comisión y familias.",
    plan: "enterprise",
    planStartDate: new Date("2024-01-01"),
    planEndDate: new Date("2024-07-01"),
    status: "approved",
    featuredHighlighting: true,
    notificationPreferences: {
      email: true,
      promotions: true,
      billing: true,
      systemUpdates: true,
    },
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-06-18"),
    createdBy: "admin_001",
    lastActiveAt: new Date("2024-06-20"),
  }
]

// ============================================================================
// Sample Business Locations
// ============================================================================

export const seedLocations: BusinessLocation[] = [
  {
    id: "loc_001",
    businessId: "biz_001",
    name: "Sede Principal - Zona Rosa",
    type: "physical",
    address: {
      street: "Carrera 13 #85-32",
      city: "Bogotá",
      state: "Cundinamarca",
      zipCode: "110221",
      country: "Colombia",
    },
    coordinates: {
      latitude: 4.6628,
      longitude: -74.0583,
    },
    businessHours: [
      { dayOfWeek: 1, isOpen: true, openTime: "11:00", closeTime: "22:00" },
      { dayOfWeek: 2, isOpen: true, openTime: "11:00", closeTime: "22:00" },
      { dayOfWeek: 3, isOpen: true, openTime: "11:00", closeTime: "22:00" },
      { dayOfWeek: 4, isOpen: true, openTime: "11:00", closeTime: "22:00" },
      { dayOfWeek: 5, isOpen: true, openTime: "11:00", closeTime: "23:00" },
      { dayOfWeek: 6, isOpen: true, openTime: "11:00", closeTime: "23:00" },
      { dayOfWeek: 0, isOpen: true, openTime: "11:00", closeTime: "21:00" },
    ],
    isActive: true,
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-05-15"),
  },
  {
    id: "loc_002",
    businessId: "biz_001",
    name: "Domicilios",
    type: "online",
    website: "https://domicilios.elcomandante.com",
    deliveryZones: ["Zona Norte", "Zona Rosa", "Centro", "Chapinero"],
    onlineContactInfo: {
      phone: "+57 301 234 5678",
      whatsapp: "+57 301 234 5678",
    },
    isActive: true,
    createdAt: new Date("2024-05-16"),
    updatedAt: new Date("2024-05-16"),
  },
  {
    id: "loc_003",
    businessId: "biz_002",
    name: "Tienda Principal",
    type: "physical",
    address: {
      street: "Calle 72 #15-47",
      city: "Bogotá",
      state: "Cundinamarca",
      zipCode: "110231",
      country: "Colombia",
    },
    businessHours: [
      { dayOfWeek: 1, isOpen: true, openTime: "08:00", closeTime: "18:00" },
      { dayOfWeek: 2, isOpen: true, openTime: "08:00", closeTime: "18:00" },
      { dayOfWeek: 3, isOpen: true, openTime: "08:00", closeTime: "18:00" },
      { dayOfWeek: 4, isOpen: true, openTime: "08:00", closeTime: "18:00" },
      { dayOfWeek: 5, isOpen: true, openTime: "08:00", closeTime: "18:00" },
      { dayOfWeek: 6, isOpen: true, openTime: "08:00", closeTime: "16:00" },
      { dayOfWeek: 0, isOpen: false },
    ],
    isActive: true,
    createdAt: new Date("2024-04-20"),
    updatedAt: new Date("2024-04-20"),
  },
  {
    id: "loc_004",
    businessId: "biz_003",
    name: "Hotel Libertad Centro",
    type: "physical",
    address: {
      street: "Carrera 7 #32-16",
      city: "Bogotá",
      state: "Cundinamarca",
      zipCode: "110311",
      country: "Colombia",
    },
    coordinates: {
      latitude: 4.6097,
      longitude: -74.0817,
    },
    businessHours: [
      { dayOfWeek: 0, isOpen: true, openTime: "00:00", closeTime: "23:59" },
      { dayOfWeek: 1, isOpen: true, openTime: "00:00", closeTime: "23:59" },
      { dayOfWeek: 2, isOpen: true, openTime: "00:00", closeTime: "23:59" },
      { dayOfWeek: 3, isOpen: true, openTime: "00:00", closeTime: "23:59" },
      { dayOfWeek: 4, isOpen: true, openTime: "00:00", closeTime: "23:59" },
      { dayOfWeek: 5, isOpen: true, openTime: "00:00", closeTime: "23:59" },
      { dayOfWeek: 6, isOpen: true, openTime: "00:00", closeTime: "23:59" },
    ],
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
]

// ============================================================================
// Sample Team Members
// ============================================================================

export const seedTeamMembers: TeamMember[] = [
  {
    id: "team_001",
    businessId: "biz_001",
    userId: "user_002",
    email: "gerente@elcomandante.com",
    name: "María González",
    role: "manager",
    invitationStatus: "accepted",
    invitedBy: "user_001",
    invitedAt: new Date("2024-05-16"),
    acceptedAt: new Date("2024-05-16"),
    isActive: true,
    permissions: {
      canManagePromotions: true,
      canViewAnalytics: true,
      canManageRedemptions: true,
      canManageTeam: false,
      canManageLocations: true,
      canViewBilling: false,
    },
    createdAt: new Date("2024-05-16"),
    updatedAt: new Date("2024-05-16"),
  },
  {
    id: "team_002",
    businessId: "biz_001",
    email: "cajero@elcomandante.com",
    name: "Carlos Rodríguez",
    role: "staff",
    invitationStatus: "pending",
    invitedBy: "user_001",
    invitedAt: new Date("2024-06-10"),
    isActive: true,
    permissions: {
      canManagePromotions: false,
      canViewAnalytics: false,
      canManageRedemptions: true,
      canManageTeam: false,
      canManageLocations: false,
      canViewBilling: false,
    },
    createdAt: new Date("2024-06-10"),
    updatedAt: new Date("2024-06-10"),
  },
]

// ============================================================================
// Sample Promotions
// ============================================================================

export const seedPromotions: Promotion[] = [
  {
    id: "promo_001",
    businessId: "biz_001",
    title: "20% de Descuento para Militares",
    description: "Obtén un 20% de descuento en todos nuestros platos principales. Válido para personal militar activo y sus familias con presentación de cédula militar.",
    type: "percentage",
    value: 20,
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-06-30"),
    isActive: true,
    status: "active",
    maxRedemptions: 100,
    currentRedemptions: 15,
    maxRedemptionsPerUser: 2,
    digitalCardEligible: true,
    targetLocations: ["loc_001", "loc_002"],
    isFeatured: true,
    featuredUntil: new Date("2024-06-30"),
    createdAt: new Date("2024-05-25"),
    updatedAt: new Date("2024-06-15"),
    createdBy: "user_001",
  },
  {
    id: "promo_002",
    businessId: "biz_002",
    title: "Uniformes - Pague 2 Lleve 3",
    description: "En la compra de 2 uniformes militares, llévate el tercero completamente gratis. Aplica en uniformes seleccionados.",
    type: "bogo",
    value: 0,
    bogoDetails: {
      buyQuantity: 2,
      getQuantity: 1,
      applicableItems: ["Uniformes", "Camisetas"],
    },
    startDate: new Date("2024-06-15"),
    endDate: new Date("2024-07-15"),
    isActive: true,
    status: "active",
    maxRedemptions: 50,
    currentRedemptions: 3,
    digitalCardEligible: false,
    targetLocations: ["loc_003"],
    isFeatured: false,
    createdAt: new Date("2024-06-10"),
    updatedAt: new Date("2024-06-10"),
    createdBy: "user_003",
  },
  {
    id: "promo_003",
    businessId: "biz_003",
    title: "Tarifa Militar Especial",
    description: "Tarifa especial de $150,000 por noche para personal militar en comisión. Incluye desayuno buffet y WiFi gratuito.",
    type: "fixed",
    value: 50000,
    originalPrice: 200000,
    startDate: new Date("2024-06-01"),
    endDate: new Date("2024-12-31"),
    isActive: true,
    status: "active",
    digitalCardEligible: true,
    targetLocations: ["loc_004"],
    isFeatured: true,
    createdAt: new Date("2024-05-20"),
    updatedAt: new Date("2024-05-20"),
    createdBy: "user_004",
  },
]

// ============================================================================
// Sample Redemptions
// ============================================================================

export const seedRedemptions: Redemption[] = [
  {
    id: "redemption_001",
    promotionId: "promo_001",
    businessId: "biz_001",
    locationId: "loc_001",
    userId: "military_user_001",
    userMilitaryId: "12345678",
    userEmail: "militar1@email.com",
    redeemedAt: new Date("2024-06-18T19:30:00"),
    redeemedBy: "user_002",
    redemptionMethod: "manual",
    originalAmount: 45000,
    discountAmount: 9000,
    finalAmount: 36000,
    verificationNotes: "Cédula militar verificada, descuento aplicado correctamente",
    status: "completed",
    createdAt: new Date("2024-06-18T19:30:00"),
    updatedAt: new Date("2024-06-18T19:30:00"),
  },
  {
    id: "redemption_002",
    promotionId: "promo_001",
    businessId: "biz_001",
    locationId: "loc_001",
    userId: "military_user_002",
    userMilitaryId: "87654321",
    redeemedAt: new Date("2024-06-19T14:15:00"),
    redeemedBy: "user_002",
    redemptionMethod: "qr_code",
    originalAmount: 32000,
    discountAmount: 6400,
    finalAmount: 25600,
    status: "completed",
    createdAt: new Date("2024-06-19T14:15:00"),
    updatedAt: new Date("2024-06-19T14:15:00"),
  },
  {
    id: "redemption_003",
    promotionId: "promo_003",
    businessId: "biz_003",
    locationId: "loc_004",
    userId: "military_user_003",
    userMilitaryId: "11223344",
    redeemedAt: new Date("2024-06-17T21:00:00"),
    redeemedBy: "user_004",
    redemptionMethod: "digital_card",
    originalAmount: 200000,
    discountAmount: 50000,
    finalAmount: 150000,
    verificationNotes: "Reserva de 3 noches, tarifa militar aplicada",
    status: "completed",
    createdAt: new Date("2024-06-17T21:00:00"),
    updatedAt: new Date("2024-06-17T21:00:00"),
  },
]

// ============================================================================
// Sample Analytics Data
// ============================================================================

export const seedAnalytics: BusinessAnalytics[] = [
  {
    id: "analytics_001",
    businessId: "biz_001",
    periodStart: new Date("2024-06-01"),
    periodEnd: new Date("2024-06-30"),
    totalImpressions: 2500,
    totalViews: 450,
    totalRedemptions: 15,
    conversionRate: 3.33,
    revenueAttributed: 540000,
    userDemographics: {
      ageGroups: {
        "18-25": 20,
        "26-35": 35,
        "36-45": 30,
        "46-55": 10,
        "56+": 5,
      },
      militaryRanks: {
        "Soldado": 40,
        "Cabo": 25,
        "Sargento": 20,
        "Suboficial": 10,
        "Oficial": 5,
      },
      cities: {
        "Bogotá": 60,
        "Medellín": 20,
        "Cali": 10,
        "Barranquilla": 6,
        "Otras": 4,
      },
      familyMembers: 25,
    },
    createdAt: new Date("2024-06-30"),
    calculatedAt: new Date("2024-07-01T06:00:00"),
  },
  {
    id: "analytics_002",
    businessId: "biz_002",
    periodStart: new Date("2024-06-01"),
    periodEnd: new Date("2024-06-30"),
    totalImpressions: 800,
    totalViews: 120,
    totalRedemptions: 3,
    createdAt: new Date("2024-06-30"),
    calculatedAt: new Date("2024-07-01T06:00:00"),
  },
]

// ============================================================================
// System Settings
// ============================================================================

export const seedSystemSettings: SystemSettings = {
  id: "global",
  platformName: "Heroes Colombia",
  platformVersion: "1.0.0",
  maintenanceMode: false,
  autoApproveBusinesses: false,
  autoApprovePromotions: true,
  maxPromotionDuration: 90,
  emailTemplates: [
    {
      id: "welcome_business",
      name: "Bienvenida Empresa",
      subject: "¡Bienvenido a Heroes Colombia!",
      template: "welcome_business_template.html",
      variables: ["businessName", "ownerName", "loginUrl"],
    },
    {
      id: "promotion_approved",
      name: "Promoción Aprobada",
      subject: "Tu promoción ha sido aprobada",
      template: "promotion_approved_template.html",
      variables: ["businessName", "promotionTitle", "promotionId"],
    },
  ],
  notificationRules: [
    {
      id: "new_business_registration",
      event: "business_registered",
      channels: ["email"],
      recipients: ["admin"],
      template: "new_business_registration",
    },
    {
      id: "promotion_created",
      event: "promotion_created",
      channels: ["email"],
      recipients: ["business"],
      template: "promotion_confirmation",
    },
  ],
  updatedAt: new Date("2024-06-01"),
  updatedBy: "admin_001",
}

// ============================================================================
// Colombian Business Categories
// ============================================================================

export const businessCategories = [
  "Restaurante",
  "Hotel",
  "Tienda Deportiva",
  "Supermercado",
  "Farmacia",
  "Ferretería",
  "Electrodomésticos",
  "Ropa y Calzado",
  "Servicios Automotrices",
  "Salud y Bienestar",
  "Educación",
  "Entretenimiento",
  "Tecnología",
  "Servicios Profesionales",
  "Belleza y Cuidado Personal",
  "Hogar y Decoración",
  "Mascotas",
  "Libros y Papelería",
  "Joyería y Accesorios",
  "Otros",
]

// ============================================================================
// Colombian Cities
// ============================================================================

export const colombianCities = [
  "Bogotá",
  "Medellín",
  "Cali",
  "Barranquilla",
  "Cartagena",
  "Cúcuta",
  "Bucaramanga",
  "Pereira",
  "Santa Marta",
  "Ibagué",
  "Villavicencio",
  "Manizales",
  "Neiva",
  "Soledad",
  "Pasto",
  "Armenia",
  "Soacha",
  "Valledupar",
  "Montería",
  "Itagüí",
]

// ============================================================================
// Helper Functions for Seed Data
// ============================================================================

export const generateBusinessId = () => `biz_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
export const generateLocationId = () => `loc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
export const generatePromotionId = () => `promo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
export const generateRedemptionId = () => `redemption_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
export const generateTeamId = () => `team_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

// ============================================================================
// Seed Data Collections for Firebase
// ============================================================================

export const getSeedData = () => ({
  businesses: seedBusinesses,
  locations: seedLocations,
  teamMembers: seedTeamMembers,
  promotions: seedPromotions,
  redemptions: seedRedemptions,
  analytics: seedAnalytics,
  planConfigurations: seedPlanConfigurations,
  systemSettings: seedSystemSettings,
  businessCategories,
  colombianCities,
})

export const getRandomBusiness = () => seedBusinesses[Math.floor(Math.random() * seedBusinesses.length)]
export const getRandomLocation = (businessId?: string) => {
  const locations = businessId
    ? seedLocations.filter(loc => loc.businessId === businessId)
    : seedLocations
  return locations[Math.floor(Math.random() * locations.length)]
}
export const getRandomPromotion = (businessId?: string) => {
  const promotions = businessId
    ? seedPromotions.filter(promo => promo.businessId === businessId)
    : seedPromotions
  return promotions[Math.floor(Math.random() * promotions.length)]
}