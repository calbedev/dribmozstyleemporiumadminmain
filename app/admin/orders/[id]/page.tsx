import { PermissionGuard } from "@/components/admin/permission-guard"
import { OrderDetail } from "@/components/admin/orders/order-detail"

interface OrderDetailPageProps {
  params: { id: string }
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  return (
    <PermissionGuard action="read" resource="orders">
      <OrderDetail orderId={params.id} />
    </PermissionGuard>
  )
}
