import { TeamPermissions } from "@/lib/types"

// Client-side permission checker (for UI)
export function hasPermission(
  businessRoles: any[],
  businessId: string,
  permission: keyof TeamPermissions
): boolean {
  const businessRole = businessRoles?.find((role: any) => role.business_id === businessId)
  return businessRole?.permissions?.[permission] === true
}

// Get user's role in business
export function getUserRole(businessRoles: any[], businessId: string) {
  return businessRoles?.find((role: any) => role.business_id === businessId)
}
