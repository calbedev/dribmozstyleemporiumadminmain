import type React from "react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import { StoreProvider } from "@/contexts/store-context"
import { AdminLoadingWrapper } from "@/components/admin/loading-wrapper"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <StoreProvider>
      <div className="flex h-screen bg-background">
        <AdminSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto p-6">
            <AdminLoadingWrapper>{children}</AdminLoadingWrapper>
          </main>
        </div>
      </div>
    </StoreProvider>
  )
}
