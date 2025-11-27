// Military ranks and branches reference data for Heroes Colombia
// Based on Colombian Armed Forces structure

export const MILITARY_RANKS = {
  "POLICIA NACIONAL": {
    "NIVEL EJECUTIVO": [
      "Patrullero",
      "Subintendente",
      "Intendente",
      "Intendente Jefe",
      "Subcomisario",
      "Comisario",
      "Pensionado",
    ],
    "OFICIALES": [
      "Subteniente",
      "Teniente",
      "Capitán",
      "Mayor",
      "Teniente Coronel",
      "Coronel",
      "Brigadier General",
      "Mayor General",
      "General",
      "Pensionado",
    ],
    "GRADOS EN LAS ESCUELAS DE FORMACIÓN": [
      "Estudiante",
    ],
    "OTROS GRADOS": [
      "Personal no uniformado",
      "Auxiliar de policía",
      "Beneficiario (padres, hijos, esposa)",
    ],
  },
  "EJÉRCITO NACIONAL": {
    "SUBOFICIALES": [
      "Cabo Tercero",
      "Cabo Segundo",
      "Cabo Primero",
      "Sargento Segundo",
      "Sargento Viceprimero",
      "Sargento Primero",
      "Sargento Mayor",
      "Sargento Mayor de comando",
      "Sargento Mayor de comando conjunto",
      "Pensionado",
    ],
    "OFICIALES": [
      "Subteniente",
      "Teniente",
      "Capitán",
      "Mayor",
      "Teniente Coronel",
      "Coronel",
      "Brigadier General",
      "Mayor General",
      "General",
      "Soldado Profesional",
      "Pensionado",
    ],
    "GRADOS EN LAS ESCUELAS DE FORMACIÓN": [
      "Estudiante",
    ],
    "OTROS GRADOS": ["Personal civil", "Servicio militar", "Beneficiarios"],
  },
  "ARMADA NACIONAL": {
    "SUBOFICIALES": [
      "Marinero Segundo",
      "Marinero Primero",
      "Suboficial Tercero",
      "Suboficial Segundo",
      "Suboficial Primero",
      "Suboficial Jefe",
      "Suboficial Jefe técnico",
      "Suboficial Jefe técnico de comando",
      "Suboficial Jefe técnico de comando conjunto",
      "pensionado",
    ],
    "OFICIALES": [
      "Teniente de Corbeta",
      "Teniente de Fragata",
      "Teniente de Navío",
      "Capitán de Corbeta",
      "Capitán de Fragata",
      "Capitán de Navío",
      "Contraalmirante",
      "Vicealmirante",
      "Almirante",
      "Pensionado",
    ],
    "OTROS GRADOS": [
      "Infante de Marina",
      "Alumno de Infantería",
      "Cadete de Marina",
      "Personal Civil",
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
      "pensionado",
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
      "pensionado",
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