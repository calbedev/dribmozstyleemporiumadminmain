"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Package } from "lucide-react"

interface LowStockProduct {
  id: string
  name: string
  stockCount: number
  minStock: number
  isOutOfStock: boolean
}

interface InventoryAlertsProps {
  products: LowStockProduct[]
  loading?: boolean
}

export function InventoryAlerts({ products, loading }: InventoryAlertsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Alertas de Estoque
          </CardTitle>
          <CardDescription>Carregando alertas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1 flex-1">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const outOfStock = products.filter((p) => p.isOutOfStock)
  const lowStock = products.filter((p) => !p.isOutOfStock)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Alertas de Estoque
        </CardTitle>
        <CardDescription>
          {outOfStock.length} produtos sem estoque, {lowStock.length} com estoque baixo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {outOfStock.map((product) => (
            <div key={product.id} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{product.name}</p>
                <p className="text-sm text-muted-foreground">Estoque: {product.stockCount}</p>
              </div>
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Sem estoque
              </Badge>
            </div>
          ))}

          {lowStock.slice(0, 5).map((product) => (
            <div key={product.id} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{product.name}</p>
                <p className="text-sm text-muted-foreground">Estoque: {product.stockCount}</p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Baixo estoque
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
