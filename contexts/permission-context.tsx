"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import { TeamPermissions, BusinessPermission } from "@/lib/types"
import type { BusinessRole } from "@/lib/auth"

interface PermissionContextType {
  currentBusinessId: string | null
  currentRole: BusinessPermission | null
  userPermissions: TeamPermissions | null
  businessRoles: BusinessRole[]
  can: (permission: keyof TeamPermissions) => boolean
  isOwner: boolean
  isManager: boolean
  isStaff: boolean
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined)

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const businessUser = user as any

  const contextValue = useMemo(() => {
    // Get business roles from user
    const businessRoles: BusinessRole[] = businessUser?.business_roles || []

    // Get current business (first business in array for now)
    // In future, this could be from a business selection dropdown
    const currentBusinessId = businessUser?.businessId || null

    // Find the role for current business
    const currentBusinessRole = businessRoles.find(
      (role: BusinessRole) => role.business_id === currentBusinessId
    )

    const currentRole = currentBusinessRole?.role || null
    const userPermissions = currentBusinessRole?.permissions || null

    // Helper function to check permissions
    const can = (permission: keyof TeamPermissions): boolean => {
      // Owners always have all permissions
      if (currentRole === BusinessPermission.owner) {
        return true
      }

      // Check specific permission
      return userPermissions?.[permission] === true
    }

    return {
      currentBusinessId,
      currentRole,
      userPermissions,
      businessRoles,
      can,
      isOwner: currentRole === BusinessPermission.owner,
      isManager: currentRole === BusinessPermission.manager,
      isStaff: currentRole === BusinessPermission.staff,
    }
  }, [businessUser])

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider")
  }
  return context
}
