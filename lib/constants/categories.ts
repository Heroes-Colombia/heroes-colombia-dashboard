/**
 * Official Business Categories for Heroes Colombia
 * Icons are from the official brandbook (bicolor variations)
 * Located in: /public/categories/
 */

export const CATEGORY_IDS = {
  ASISTENCIA_JURIDICA: 'asistenciaJuridica',
  BARES: 'bares',
  BELLEZA: 'belleza',
  DEPORTES: 'deportes',
  EDUCACION: 'educacion',
  ENTRETENIMIENTO: 'entretenimiento',
  EVENTOS: 'eventos',
  HOGAR: 'hogar',
  HOTELES: 'hoteles',
  JUGUETERIAS: 'jugueteria',
  MASCOTAS: 'mascotas',
  PAPELERIAS: 'papeleria',
  RESTAURANTES: 'restaurantes',
  SALUD: 'salud',
  SEGUROS: 'seguros',
  TECNOLOGIA: 'tecnologia',
  TELEFONIA: 'telefonia',
  TIENDA_MILITAR: 'tiendaMilitar',
  VEHICULOS: 'vehiculos',
  VESTUARIO: 'vestuario',
  VIVIENDA: 'vivienda',
} as const

export type CategoryId = typeof CATEGORY_IDS[keyof typeof CATEGORY_IDS]

export interface CategoryDefinition {
  id: CategoryId
  name: string
  iconPath: string
  description: string
  sortOrder: number
}

/**
 * Official category definitions matching Firebase schema
 * Icons use the bicolor variations from brandbook
 */
export const CATEGORIES: Record<CategoryId, CategoryDefinition> = {
  [CATEGORY_IDS.RESTAURANTES]: {
    id: CATEGORY_IDS.RESTAURANTES,
    name: 'Restaurantes',
    iconPath: '/categories/Restaurantes - Icono - Bicolor.png',
    description: 'Comida y bebidas',
    sortOrder: 1,
  },
  [CATEGORY_IDS.SALUD]: {
    id: CATEGORY_IDS.SALUD,
    name: 'Salud',
    iconPath: '/categories/Salud - Icono - Bicolor.png',
    description: 'Servicios médicos y salud',
    sortOrder: 2,
  },
  [CATEGORY_IDS.EDUCACION]: {
    id: CATEGORY_IDS.EDUCACION,
    name: 'Educación',
    iconPath: '/categories/Educación - Icono - Bicolor.png',
    description: 'Cursos y capacitación',
    sortOrder: 3,
  },
  [CATEGORY_IDS.DEPORTES]: {
    id: CATEGORY_IDS.DEPORTES,
    name: 'Deportes',
    iconPath: '/categories/Deportes - Icono - Bicolor.png',
    description: 'Gimnasios y actividades deportivas',
    sortOrder: 4,
  },
  [CATEGORY_IDS.BELLEZA]: {
    id: CATEGORY_IDS.BELLEZA,
    name: 'Belleza',
    iconPath: '/categories/Belleza - Icono - Bicolor.png',
    description: 'Cuidado personal y estética',
    sortOrder: 5,
  },
  [CATEGORY_IDS.VESTUARIO]: {
    id: CATEGORY_IDS.VESTUARIO,
    name: 'Vestuario',
    iconPath: '/categories/Vestuario - Icono - Bicolor.png',
    description: 'Ropa y accesorios',
    sortOrder: 6,
  },
  [CATEGORY_IDS.TECNOLOGIA]: {
    id: CATEGORY_IDS.TECNOLOGIA,
    name: 'Tecnología',
    iconPath: '/categories/Tecnología - Icono - Bicolor.png',
    description: 'Electrónica y tecnología',
    sortOrder: 7,
  },
  [CATEGORY_IDS.HOGAR]: {
    id: CATEGORY_IDS.HOGAR,
    name: 'Hogar',
    iconPath: '/categories/Hogar - Icono - Bicolor.png',
    description: 'Muebles y decoración',
    sortOrder: 8,
  },
  [CATEGORY_IDS.VEHICULOS]: {
    id: CATEGORY_IDS.VEHICULOS,
    name: 'Vehículos',
    iconPath: '/categories/Vehículos - Icono - Bicolor.png',
    description: 'Autos y mantenimiento',
    sortOrder: 9,
  },
  [CATEGORY_IDS.HOTELES]: {
    id: CATEGORY_IDS.HOTELES,
    name: 'Hoteles',
    iconPath: '/categories/Hoteles - Icono - Bicolor.png',
    description: 'Alojamiento y hospedaje',
    sortOrder: 10,
  },
  [CATEGORY_IDS.ENTRETENIMIENTO]: {
    id: CATEGORY_IDS.ENTRETENIMIENTO,
    name: 'Entretenimiento',
    iconPath: '/categories/Entretenimiento - Icono - Bicolor.png',
    description: 'Cine, juegos y diversión',
    sortOrder: 11,
  },
  [CATEGORY_IDS.EVENTOS]: {
    id: CATEGORY_IDS.EVENTOS,
    name: 'Eventos',
    iconPath: '/categories/Eventos - Icono - Bicolor.png',
    description: 'Organización de eventos',
    sortOrder: 12,
  },
  [CATEGORY_IDS.BARES]: {
    id: CATEGORY_IDS.BARES,
    name: 'Bares',
    iconPath: '/categories/Bares - Icono - Bicolor.png',
    description: 'Vida nocturna',
    sortOrder: 13,
  },
  [CATEGORY_IDS.TELEFONIA]: {
    id: CATEGORY_IDS.TELEFONIA,
    name: 'Telefonía',
    iconPath: '/categories/Telefonía - Icono - Bicolor.png',
    description: 'Servicios de telecomunicaciones',
    sortOrder: 14,
  },
  [CATEGORY_IDS.SEGUROS]: {
    id: CATEGORY_IDS.SEGUROS,
    name: 'Seguros',
    iconPath: '/categories/Seguros - Icono - Bicolor.png',
    description: 'Seguros y protección',
    sortOrder: 15,
  },
  [CATEGORY_IDS.VIVIENDA]: {
    id: CATEGORY_IDS.VIVIENDA,
    name: 'Vivienda',
    iconPath: '/categories/Vivienda - Icono - Bicolor.png',
    description: 'Bienes raíces',
    sortOrder: 16,
  },
  [CATEGORY_IDS.TIENDA_MILITAR]: {
    id: CATEGORY_IDS.TIENDA_MILITAR,
    name: 'Tienda Militar',
    iconPath: '/categories/Tienda militar - Icono - Bicolor.png',
    description: 'Artículos militares',
    sortOrder: 17,
  },
  [CATEGORY_IDS.ASISTENCIA_JURIDICA]: {
    id: CATEGORY_IDS.ASISTENCIA_JURIDICA,
    name: 'Asistencia Jurídica',
    iconPath: '/categories/Asistencia juridica - Icono - Bicolor.png',
    description: 'Servicios legales',
    sortOrder: 18,
  },
  [CATEGORY_IDS.MASCOTAS]: {
    id: CATEGORY_IDS.MASCOTAS,
    name: 'Mascotas',
    iconPath: '/categories/Mascotas - Icono - Bicolor.png',
    description: 'Cuidado de mascotas',
    sortOrder: 19,
  },
  [CATEGORY_IDS.JUGUETERIAS]: {
    id: CATEGORY_IDS.JUGUETERIAS,
    name: 'Jugueterías',
    iconPath: '/categories/Jugueterias - Icono - Bicolor.png',
    description: 'Juguetes y juegos',
    sortOrder: 20,
  },
  [CATEGORY_IDS.PAPELERIAS]: {
    id: CATEGORY_IDS.PAPELERIAS,
    name: 'Papelerías',
    iconPath: '/categories/Papelerias - Icono - Bicolor.png',
    description: 'Útiles y papelería',
    sortOrder: 21,
  },
}

/**
 * Get all categories sorted by sort order
 */
export function getAllCategories(): CategoryDefinition[] {
  return Object.values(CATEGORIES).sort((a, b) => a.sortOrder - b.sortOrder)
}

/**
 * Get category by ID
 */
export function getCategoryById(id: string): CategoryDefinition | undefined {
  return CATEGORIES[id as CategoryId]
}

/**
 * Get category icon path
 */
export function getCategoryIcon(id: string): string {
  const category = getCategoryById(id)
  return category?.iconPath || '/categories/default.png'
}

/**
 * Get category name
 */
export function getCategoryName(id: string): string {
  const category = getCategoryById(id)
  return category?.name || 'Sin categoría'
}
