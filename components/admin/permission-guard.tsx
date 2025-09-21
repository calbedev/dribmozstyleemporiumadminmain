"use client"

import type React from "react"

import { useEffect, useState } from "react"
import {  hasPermission } from "@/lib/auth"
import { useStore } from "@/contexts/store-context"
import { useUser } from "@stackframe/stack"
import { redirect } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { useQuery } from "convex/react"
import { Id } from "@/convex/_generated/dataModel"

interface PermissionGuardProps {
  children: React.ReactNode
  action: string
  resource: string
  fallback?: React.ReactNode
}
type UserRole = "superadmin" | "owner" | "moderator" | "editor" | "shipper" | "viewer"

export function PermissionGuard({ children, action, resource, fallback }: PermissionGuardProps) {
  //const [user, setUser] = useState<User | null>(null)
  //const [loading, setLoading] = useState(true)

  //useEffect(() => {
  //  getCurrentUser().then((user) => {
  //    setUser(user)
  //    setLoading(false)
  //  })
  //}, [])

  const user = useUser();
  const { selectedStore, isLoading } = useStore()
  if (!user) { redirect('/handler/login'); }

  //if (loading) {
  //  return (<div>Loading...</div>)
  //}
  const role = useQuery(api.adminteam.getUserRole, { userId: user?.id, storeId: selectedStore?._id as Id<"stores">})
  
  if (isLoading) {
    return (<div>Loading...</div>)
  }
  
  if (!role ) {
    return fallback || <div>Access denied</div>
  }

  if (!user || !hasPermission(role, action, resource)) {
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
