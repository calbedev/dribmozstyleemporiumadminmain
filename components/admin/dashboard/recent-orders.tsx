"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"

interface Order {
  _id: string
  orderNumber: string
  userName: string
  total: number
  status: string
  createdAt: string
}

interface RecentOrdersProps {
  orders: Order[]
  loading?: boolean
}

export function RecentOrders({ orders, loading }: RecentOrdersProps) {
  if (loading) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Pedidos Recentes</CardTitle>
          <CardDescription>Carregando pedidos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="ml-4 space-y-1 flex-1">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "MZN",
    }).format(value)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "SHIPPED":
        return "bg-blue-100 text-blue-800"
      case "DELIVERED":
        return "bg-emerald-100 text-emerald-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Pedidos Recentes</CardTitle>
        <CardDescription>Você teve {orders.length} pedidos recentes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {orders.map((order) => (
            <div key={order._id} className="flex items-center">
              <div className="ml-4 space-y-1 flex-1">
                <p className="text-sm font-medium leading-none">{order.orderNumber}</p>
                <p className="text-sm text-muted-foreground">{order.userName}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(order.total)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/orders/${order._id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
