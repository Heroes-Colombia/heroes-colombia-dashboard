// Military ranks and branches reference data for Heroes Colombia
// Based on Colombian Armed Forces structure

export const MILITARY_RANKS = {
  "POLICIA NACIONAL": {
    "NIVEL EJECUTIVO": [
      "Patrullero",
      "Subintendente",
      "Intendente",
      "Intendente jefe",
      "Subcomisario",
      "Comisario",
      "En uso de buen retiro",
    ],
    "SUBOFICIALES": [
      "cabo segundo",
      "cabo primero",
      "sargento segundo",
      "sargento viceprimero",
      "sargento primero",
      "sargento mayor",
      "en uso de buen retiro",
    ],
    "OFICIALES": [
      "subteniente",
      "teniente",
      "capitán",
      "mayor",
      "teniente coronel",
      "coronel",
      "brigadier general",
      "mayor general",
      "teniente general",
      "general",
      "en uso de buen retiro",
    ],
    "GRADOS EN LAS ESCUELAS DE FORMACIÓN": [
      "Estudiante",
      "Cadete",
      "Alférez",
    ],
    "OTROS GRADOS": [
      "Personal no uniformado",
      "Auxiliar de policía",
      "Beneficiario (padres, hijos, esposa)",
    ],
  },
  "EJÉRCITO NACIONAL": {
    "SUBOFICIALES": [
      "Cabo tercero",
      "Cabo segundo",
      "Cabo primero",
      "Sargento segundo",
      "Sargento viceprimero",
      "Sargento primero",
      "Sargento mayor",
      "Sargento mayor de comando",
      "Sargento mayor de comando conjunto",
      "En uso de buen retiro",
    ],
    "OFICIALES": [
      "Subteniente",
      "Teniente",
      "Capitán",
      "Mayor",
      "Teniente coronel",
      "Coronel",
      "Brigadier general",
      "Mayor general",
      "General",
      "En uso de buen retiro",
      "Soldado profesional",
      "En uso de buen retiro",
    ],
    "GRADOS EN LAS ESCUELAS DE FORMACIÓN": [
      "Estudiante",
      "Cadete",
      "Alférez",
    ],
    "OTROS GRADOS": ["Personal civil", "Servicio militar", "Beneficiarios"],
  },
  "ARMADA NACIONAL": {
    "SUBOFICIALES": [
      "Marinero segundo",
      "Marinero primero",
      "Suboficial tercero",
      "Suboficial segundo",
      "Suboficial primero",
      "Suboficial jefe",
      "Suboficial jefe técnico",
      "Suboficial jefe técnico de comando",
      "Suboficial jefe técnico de comando conjunto",
      "En uso de buen retiro",
    ],
    "OFICIALES": [
      "Teniente de corbeta",
      "Teniente de fragata",
      "Teniente de navío",
      "Capitán de corbeta",
      "Capitán de fragata",
      "Capitán de navío",
      "Contraalmirante",
      "Vicealmirante",
      "Almirante",
      "En uso de buen retiro",
    ],
    "OTROS GRADOS": [
      "Infante de marina",
      "Alumno de infantería",
      "Cadete de marina",
      "Personal civil",
      "Beneficiarios",
    ],
  },
  "FUERZA AEROESPACIAL": {
    "SUBOFICIALES": [
      "Aerotécnico",
      "Técnico cuarto",
      "Técnico tercero",
      "Técnico segundo",
      "Técnico primero",
      "Técnico subjefe",
      "Técnico jefe",
      "Técnico jefe de comando",
      "En uso de buen retiro",
    ],
    "OFICIALES": [
      "Subteniente",
      "Teniente",
      "Capitán",
      "Mayor",
      "Teniente coronel",
      "Coronel",
      "Brigadier general",
      "Mayor general",
      "General",
      "En uso de buen retiro",
    ],
    "OTROS GRADOS": [
      "Estudiante",
      "Personal civil",
      "Soldado (servicio militar)",
    ],
  },
} as const

export type MilitaryBranch = keyof typeof MILITARY_RANKS
export type MilitaryRankCategory<T extends MilitaryBranch> = keyof typeof MILITARY_RANKS[T]

// Utility function to parse rank string from Firebase
export function parseRankString(rankString: string): {
  branch: string
  category: string
  rank: string
} {
  // Expected format: "POLICIA NACIONAL_NIVEL EJECUTIVO_Patrullero"
  const parts = rankString.split('_')

  if (parts.length >= 3) {
    return {
      branch: parts[0],
      category: parts[1],
      rank: parts[2]
    }
  }

  // Fallback for unexpected format
  return {
    branch: "Unknown",
    category: "Unknown",
    rank: rankString
  }
}

// Utility function to get all branches
export function getAllBranches(): string[] {
  return Object.keys(MILITARY_RANKS)
}

// Utility function to validate if a rank string is valid
export function isValidRank(rankString: string): boolean {
  const { branch, category, rank } = parseRankString(rankString)

  if (!(branch in MILITARY_RANKS)) return false

  const branchData = MILITARY_RANKS[branch as MilitaryBranch]
  if (!(category in branchData)) return false

  const categoryRanks = branchData[category as keyof typeof branchData]
  return Array.isArray(categoryRanks) && categoryRanks.includes(rank)
}