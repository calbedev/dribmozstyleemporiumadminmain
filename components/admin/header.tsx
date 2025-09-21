"use client"

import { usePermissions } from "./permission-guard"
import { useStore } from "@/contexts/store-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LogOut, Settings, User, Store } from "lucide-react"
import { UserButton, useUser } from "@stackframe/stack"

export function AdminHeader() {
  //const { user } = usePermissions()
  const user = useUser();
  const { userRole } = useStore()
  
  const { selectedStore, stores, setSelectedStore, isLoading } = useStore()
  console.log("-----------------DEBUG--------------: Selected Store", selectedStore)
  console.log("-----------------DEBUG--------------: All Stores", stores)

  if (!user) return null

  const showStoreSelector =  stores.length > 0

  return (
    <header className="flex h-16 items-center justify-between px-6 border-b bg-background">
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold">Painel Administrativo</h2>

        {showStoreSelector && (
          <div className="flex items-center space-x-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedStore?._id}
              onValueChange={(value) => {
                const store = stores.find((s) => s._id === value)
                setSelectedStore(store || null)
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar loja..." />
              </SelectTrigger>
              <SelectContent>
                {stores.map((store) => (
                  <SelectItem key={store._id} value={store._id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <span>{userRole}</span>
        <UserButton/>
      </div>
    </header>
  )
}
