"use client"

import { TeamPermissions } from "@/lib/types"
import { ReactNode } from "react"
import { usePermissions } from "@/contexts/permission-context"

interface PermissionGuardProps {
  permission: keyof TeamPermissions
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({ permission, fallback, children }: PermissionGuardProps) {
  const { can } = usePermissions()

  // Check permission using context
  const hasAccess = can(permission)

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}
