"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { PermissionGuard } from "@/components/admin/permission-guard"
import { PeriodSelector } from "@/components/admin/dashboard/period-selector"
import { KPICards } from "@/components/admin/dashboard/kpi-cards"
import { RecentOrders } from "@/components/admin/dashboard/recent-orders"
import { InventoryAlerts } from "@/components/admin/dashboard/inventory-alerts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, MessageSquare } from "lucide-react"
import { useStore } from "@/contexts/store-context"
import type { Id } from "@/convex/_generated/dataModel"

export default function AdminDashboard() {
  const [period, setPeriod] = useState("30d")
  const { selectedStore, isLoading } = useStore()

  const storeId = selectedStore?._id as Id<"stores">

  const kpis = useQuery(api.admindashboard.getKPIs, { period: period as any, storeId })
  const recentOrders = useQuery(api.admindashboard.getRecentOrders, { limit: 5, storeId })
  const lowStockProducts = useQuery(api.admindashboard.getLowStockProducts, { threshold: 5, storeId })
  const abandonedCarts = useQuery(api.admindashboard.getAbandonedCarts, { hoursThreshold: 24, storeId })
  const pendingReviews = useQuery(api.admindashboard.getPendingReviews, { storeId })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Carregando dados da loja...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!selectedStore) {
    return (
      <PermissionGuard action="read" resource="dashboard">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Nenhuma loja selecionada</p>
          </div>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">Selecione uma loja no cabeçalho para visualizar o dashboard.</p>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    )
  }

  return (
    <PermissionGuard action="read" resource="dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral da loja: <span className="font-medium">{selectedStore.name}</span>
            </p>
          </div>
          <PeriodSelector value={period} onValueChange={setPeriod} />
        </div>

        <KPICards
          data={kpis || { totalRevenue: 0, orderCount: 0, averageTicket: 0, newCustomers: 0 }}
          loading={kpis === undefined}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Produtos Mais Vendidos</CardTitle>
              <CardDescription>Top 5 produtos por quantidade vendida</CardDescription>
            </CardHeader>
            <CardContent>
              {kpis?.bestSelling && kpis.bestSelling.length > 0 ? (
                <div className="space-y-4">
                  {kpis.bestSelling.map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          #{index + 1} {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">{product.quantity} unidades vendidas</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "MZN",
                          }).format(product.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  {kpis === undefined ? "Carregando..." : "Nenhum produto vendido no período"}
                </div>
              )}
            </CardContent>
          </Card>

          <RecentOrders orders={recentOrders || []} loading={recentOrders === undefined} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InventoryAlerts products={lowStockProducts || []} loading={lowStockProducts === undefined} />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinhos Abandonados
              </CardTitle>
              <CardDescription>Últimas 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{abandonedCarts?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">carrinhos abandonados</p>
                </div>
                {abandonedCarts && abandonedCarts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Valor total perdido:</p>
                    <p className="text-lg font-bold text-destructive">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "MZN",
                      }).format(abandonedCarts.reduce((sum, cart) => sum + cart.total, 0))}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Reviews Pendentes
              </CardTitle>
              <CardDescription>Aguardando moderação</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold">{pendingReviews || 0}</div>
                <p className="text-sm text-muted-foreground">reviews para aprovar</p>
                {pendingReviews && pendingReviews > 0 && (
                  <Badge variant="secondary" className="mt-2">
                    Ação necessária
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGuard>
  )
}
