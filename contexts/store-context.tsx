"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { useUser } from "@stackframe/stack"
import { redirect } from "next/navigation"

interface Store {
  _id: Id<"stores">
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}
type UserRole = "superadmin" | "owner" | "moderator" | "editor" | "shipper" | "viewer"

interface StoreContextType {
  selectedStore: Store | null
  stores: Store[]
  setSelectedStore: (store: Store | null) => void
  isLoading: boolean
  hasNoStores: boolean
  userRole: UserRole 
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const user = useUser();
  if (!user) { redirect('/handler/login'); }
  const userId = user?.id
  console.log("User ID:", userId);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)

  const storesQuery = useQuery(api.adminstores.getUserStores, userId ? { userId } : "skip")
  console.log("Minhas lojas", storesQuery)
  const userRole = useQuery(api.adminteam.getUserRole, { userId: user?.id, storeId: selectedStore?._id as Id<"stores">})
  const isLoading = storesQuery === undefined

  const stores: Store[] = (storesQuery || []).map((store: any) => ({
    _id: store._id,
    name: store.name ?? "",
    slug: store.slug ?? "",
    description: store.description,
    logo: typeof store.logo === "string" ? store.logo : undefined,
    website: store.website,
    phone: store.phone,
    email: store.email,
    address: store.address,
    isActive: store.isActive ?? false,
    createdAt: store.createdAt ?? store._creationTime ?? 0,
    updatedAt: store.updatedAt ?? store._creationTime ?? 0,
  }))
  const hasNoStores = !isLoading && stores.length === 0

  useEffect(() => {
    // Só tenta selecionar uma loja se não está carregando e há lojas disponíveis
    if (!isLoading && !selectedStore && stores.length > 0) {
      // Seleciona a primeira loja ativa, ou a primeira disponível
      const activeStore = stores.find((store) => store.isActive) || stores[0]
      setSelectedStore(activeStore)
    }
  }, [stores, selectedStore, isLoading])

  return (
    <StoreContext.Provider
      value={{
        selectedStore,
        stores,
        setSelectedStore,
        isLoading,
        hasNoStores,
        userRole
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider")
  }
  return context
}
