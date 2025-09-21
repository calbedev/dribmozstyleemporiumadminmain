"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { usePermissions } from "@/components/admin/permission-guard"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface OrderDetailProps {
  orderId: string
}

export function OrderDetail({ orderId }: OrderDetailProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [notes, setNotes] = useState("")

  const { can } = usePermissions()
  const { toast } = useToast()

  const order = useQuery(api.adminorders.getById, { id: orderId as any })
  const updateStatus = useMutation(api.adminorders.updateStatus)
  const updatePaymentStatus = useMutation(api.adminorders.updatePaymentStatus)

  const handleStatusUpdate = async () => {
    try {
      await updateStatus({
        id: orderId as any,
        status: newStatus as any,
        trackingNumber: trackingNumber || undefined,
        notes: notes || undefined,
      })
      toast({
        title: "Sucesso",
        description: "Status do pedido atualizado",
      })
      setStatusDialogOpen(false)
      setNewStatus("")
      setTrackingNumber("")
      setNotes("")
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

  if (order === undefined) {
    return <div>Carregando...</div>
  }

  if (order === null) {
    return <div>Pedido não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pedido {order.orderNumber}</h1>
            <p className="text-muted-foreground">Criado em {formatDate(order.createdAt)}</p>
          </div>
        </div>

        {can("write", "orders") && (
          <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Atualizar Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atualizar Status do Pedido</DialogTitle>
                <DialogDescription>Altere o status do pedido {order.orderNumber}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Novo Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pendente</SelectItem>
                      <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                      <SelectItem value="PROCESSING">Processando</SelectItem>
                      <SelectItem value="SHIPPED">Enviado</SelectItem>
                      <SelectItem value="DELIVERED">Entregue</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                      <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newStatus === "SHIPPED" && (
                  <div className="space-y-2">
                    <Label htmlFor="tracking">Código de Rastreamento</Label>
                    <Input
                      id="tracking"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Digite o código de rastreamento"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre a mudança de status"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleStatusUpdate} disabled={!newStatus}>
                  Atualizar Status
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Itens do Pedido</CardTitle>
              <CardDescription>{order.items.length} itens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item._id} className="flex items-center space-x-4">
                    <img
                      src={item.product?.thumbnail || "/placeholder.svg?height=60&width=60"}
                      alt={item.product?.name || "Produto"}
                      className="h-15 w-15 rounded object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product?.name}</h4>
                      {item.variant && (
                        <div className="text-sm text-muted-foreground">
                          {item.variant.color && (
                            <span className="inline-flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-full border"
                                style={{ backgroundColor: item.variant.color.hexCode }}
                              />
                              {item.variant.color.name}
                            </span>
                          )}
                          {item.variant.color && item.variant.size && " • "}
                          {item.variant.size && <span>{item.variant.size.name}</span>}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">Quantidade: {item.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(item.price)}</div>
                      <div className="text-sm text-muted-foreground">
                        Total: {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Nome</Label>
                  <p>{order.user?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p>{order.user?.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço de Entrega</CardTitle>
            </CardHeader>
            <CardContent>
              {order.shippingAddress && (
                <div className="space-y-2">
                  <p>
                    Quadra {order.shippingAddress.block}, Casa {order.shippingAddress.houseNumber}
                    {order.shippingAddress.buildingNumber && `, Prédio ${order.shippingAddress.buildingNumber}`}
                  </p>
                  {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                  <p>
                    {order.shippingAddress.neighborhood?.name}, {order.shippingAddress.city}
                  </p>
                  <p>
                    {order.shippingAddress.province} - {order.shippingAddress.zipCode}
                  </p>
                  {order.shippingAddress.reference && (
                    <p className="text-sm text-muted-foreground">Referência: {order.shippingAddress.reference}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Order Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Status Atual</span>
                <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span>Pagamento</span>
                <Badge
                  className={
                    order.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                  }
                >
                  {order.paymentStatus}
                </Badge>
              </div>

              {order.trackingNumber && (
                <div>
                  <Label className="text-sm font-medium">Código de Rastreamento</Label>
                  <p className="font-mono text-sm">{order.trackingNumber}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Criado:</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between">
                    <span>Pago:</span>
                    <span>{formatDate(order.paidAt)}</span>
                  </div>
                )}
                {order.shippedAt && (
                  <div className="flex justify-between">
                    <span>Enviado:</span>
                    <span>{formatDate(order.shippedAt)}</span>
                  </div>
                )}
                {order.deliveredAt && (
                  <div className="flex justify-between">
                    <span>Entregue:</span>
                    <span>{formatDate(order.deliveredAt)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>{formatCurrency(order.shipping)}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Taxa</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-medium text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>

              {order.paymentMethod && (
                <div className="pt-4">
                  <Label className="text-sm font-medium">Método de Pagamento</Label>
                  <p>{order.paymentMethod}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
