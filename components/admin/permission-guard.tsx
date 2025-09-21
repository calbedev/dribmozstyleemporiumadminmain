"use client"

import type React from "react"

import { hasPermission } from "@/lib/auth"
import { useStore } from "@/contexts/store-context"
import { useUser } from "@stackframe/stack"
import { redirect } from "next/navigation"

interface PermissionGuardProps {
  children: React.ReactNode
  action: string
  resource: string
  fallback?: React.ReactNode
}
type UserRole = "superadmin" | "owner" | "moderator" | "editor" | "shipper" | "viewer"

export function PermissionGuard({ children, action, resource, fallback }: PermissionGuardProps) {
  const user = useUser();
  const { selectedStore, isLoading, userRole } = useStore()
  if (!user) { redirect('/handler/login'); }

  if (isLoading) {
    return (<div>Loading...</div>)
  }
  
  if (!userRole) {
    return fallback || <div>Access denied</div>
  }

  if (!hasPermission(userRole, action, resource)) {
    return fallback || <div>Access denied</div>
  }

  return <>{children}</>
}

export function usePermissions() {
 
  const can = (userRole: UserRole, action: string, resource: string) => {
    return userRole ? hasPermission(userRole, action, resource) : false
  }
  return { can }
}