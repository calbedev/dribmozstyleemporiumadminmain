"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useStore } from "@/contexts/store-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePermissions } from "@/components/admin/permission-guard"
import { Search, MoreHorizontal, Eye, Package, Truck, CheckCircle, XCircle, Users, Store } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export function OrderList() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const { can } = usePermissions()
  const { userRole } = useStore()
  if (!userRole) {
    return <div>Access denied</div>
  }
  const { selectedStore } = useStore()
  const { toast } = useToast()

  const userOrders = useQuery(
    api.adminorders.list,
    userRole === "superadmin"
      ? {
          search: search || undefined,
          status: statusFilter !== "all" ? (statusFilter as any) : undefined,
          paymentStatus: paymentFilter !== "all" ? (paymentFilter as any) : undefined,
          limit: 50,
        }
      : "skip",
  )

  const storeOrders = useQuery(api.adminorders.listStoreOrders, {
    storeId: selectedStore?._id,
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    paymentStatus: paymentFilter !== "all" ? (paymentFilter as any) : undefined,
    limit: 50,
  })

  const userOrderStats = useQuery(api.adminorders.getStatusStats, userRole === "superadmin" ? {} : "skip")

  const storeOrderStats = useQuery(api.adminorders.getStoreOrderStatusStats, {
    storeId: selectedStore?._id,
  })

  const updateStatus = useMutation(api.adminorders.updateStatus)

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus({ id: orderId as any, status: newStatus as any })
      toast({
        title: "Sucesso",
        description: "Status do pedido atualizado",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "MZN",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800"
      case "PROCESSING":
        return "bg-purple-100 text-purple-800"
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-800"
      case "DELIVERED":
        return "bg-green-100 text-green-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      case "REFUNDED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      case "REFUNDED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // A função agora aceita 'orderType' para determinar o link correto
  const renderOrdersTable = (orders: any[], showStore = false, orderType: "store" | "user" = "user") => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pedido</TableHead>
          <TableHead>Cliente</TableHead>
          {showStore && <TableHead>Loja</TableHead>}
          <TableHead>Data</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Pagamento</TableHead>
          <TableHead>Localização</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order._id}>
            <TableCell>
              <div>
                <div className="font-medium">{order.orderNumber}</div>
                {order.trackingNumber && <div className="text-sm text-muted-foreground">{order.trackingNumber}</div>}
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{order.userName}</div>
                <div className="text-sm text-muted-foreground">{order.userEmail}</div>
              </div>
            </TableCell>
            {showStore && (
              <TableCell>
                <div className="font-medium">{order.storeName}</div>
              </TableCell>
            )}
            <TableCell>{formatDate(order.createdAt)}</TableCell>
            <TableCell className="font-medium">{formatCurrency(order.total)}</TableCell>
            <TableCell>
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            </TableCell>
            <TableCell>
              <Badge className={getPaymentStatusColor(order.paymentStatus)}>{order.paymentStatus}</Badge>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                <div>{order.shippingCity}</div>
                <div className="text-muted-foreground">{order.shippingNeighborhood}</div>
              </div>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    {/* O href do Link é definido dinamicamente com base no orderType */}
                    <Link href={orderType === "store" ? `/admin/ordersstore/${order._id}` : `/admin/orders/${order._id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Link>
                  </DropdownMenuItem>

                  {can(userRole,"write", "orders") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Atualizar Status</DropdownMenuLabel>
                      {order.status === "PENDING" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(order._id, "CONFIRMED")}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirmar
                        </DropdownMenuItem>
                      )}
                      {order.status === "CONFIRMED" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(order._id, "PROCESSING")}>
                          <Package className="mr-2 h-4 w-4" />
                          Processar
                        </DropdownMenuItem>
                      )}
                      {order.status === "PROCESSING" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(order._id, "SHIPPED")}>
                          <Truck className="mr-2 h-4 w-4" />
                          Enviar
                        </DropdownMenuItem>
                      )}
                      {order.status === "SHIPPED" && (
                        <DropdownMenuItem onClick={() => handleStatusUpdate(order._id, "DELIVERED")}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Entregar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(order._id, "CANCELLED")}
                        className="text-destructive"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  const renderStatusStats = (stats: any) => (
    <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-yellow-600">{stats.PENDING}</div>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.CONFIRMED}</div>
          <p className="text-xs text-muted-foreground">Confirmados</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.PROCESSING}</div>
          <p className="text-xs text-muted-foreground">Processando</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-indigo-600">{stats.SHIPPED}</div>
          <p className="text-xs text-muted-foreground">Enviados</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.DELIVERED}</div>
          <p className="text-xs text-muted-foreground">Entregues</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-red-600">{stats.CANCELLED}</div>
          <p className="text-xs text-muted-foreground">Cancelados</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="text-2xl font-bold text-gray-600">{stats.REFUNDED}</div>
          <p className="text-xs text-muted-foreground">Reembolsados</p>
        </CardContent>
      </Card>
    </div>
  )

  if ((userOrders === undefined && userRole === "superadmin") || storeOrders === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
          <CardDescription>Carregando pedidos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground">
          {userRole === "superadmin"
            ? "Gerencie todos os pedidos do sistema"
            : `Gerencie os pedidos da loja ${selectedStore?.name || ""}`}
        </p>
      </div>

      {userRole === "superadmin" ? (
        <Tabs defaultValue="store-orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="store-orders" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Pedidos das Lojas
            </TabsTrigger>
            <TabsTrigger value="user-orders" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pedidos dos Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store-orders" className="space-y-6">
            {storeOrderStats && renderStatusStats(storeOrderStats)}

            <Card>
              <CardHeader>
                <CardTitle>Pedidos das Lojas</CardTitle>
                <CardDescription>Pedidos destinados às lojas parceiras</CardDescription>
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por número do pedido ou rastreamento..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                      <SelectItem value="PROCESSING">Processando</SelectItem>
                      <SelectItem value="SHIPPED">Enviado</SelectItem>
                      <SelectItem value="DELIVERED">Entregue</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                      <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos pagamentos</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="PAID">Pago</SelectItem>
                      <SelectItem value="FAILED">Falhou</SelectItem>
                      <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {/* Chamada atualizada para incluir o orderType 'store' */}
                {renderOrdersTable(storeOrders?.orders || [], true, "store")}
                {storeOrders?.orders.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user-orders" className="space-y-6">
            {userOrderStats && renderStatusStats(userOrderStats)}

            <Card>
              <CardHeader>
                <CardTitle>Pedidos dos Usuários</CardTitle>
                <CardDescription>Pedidos diretos dos usuários finais</CardDescription>
                <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por número do pedido ou rastreamento..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                      <SelectItem value="PROCESSING">Processando</SelectItem>
                      <SelectItem value="SHIPPED">Enviado</SelectItem>
                      <SelectItem value="DELIVERED">Entregue</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                      <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos pagamentos</SelectItem>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="PAID">Pago</SelectItem>
                      <SelectItem value="FAILED">Falhou</SelectItem>
                      <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {/* Chamada atualizada para incluir o orderType 'user' */}
                {renderOrdersTable(userOrders?.orders || [], false, "user")}
                {userOrders?.orders.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-6">
          {storeOrderStats && renderStatusStats(storeOrderStats)}

          <Card>
            <CardHeader>
              <CardTitle>Pedidos da Loja</CardTitle>
              <CardDescription>Gerencie os pedidos da sua loja</CardDescription>
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número do pedido ou rastreamento..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                    <SelectItem value="PROCESSING">Processando</SelectItem>
                    <SelectItem value="SHIPPED">Enviado</SelectItem>
                    <SelectItem value="DELIVERED">Entregue</SelectItem>
                    <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos pagamentos</SelectItem>
                    <SelectItem value="PENDING">Pendente</SelectItem>
                    <SelectItem value="PAID">Pago</SelectItem>
                    <SelectItem value="FAILED">Falhou</SelectItem>
                    <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
                {/* A visão de não-superadmin sempre será de pedidos de loja */}
              {renderOrdersTable(storeOrders?.orders || [], false, "store")}
              {storeOrders?.orders.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}