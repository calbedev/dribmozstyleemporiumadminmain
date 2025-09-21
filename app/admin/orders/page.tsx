import { PermissionGuard } from "@/components/admin/permission-guard"
import { OrderList } from "@/components/admin/orders/order-list"

export default function OrdersPage() {
  return (
    <PermissionGuard action="read" resource="orders">
      <OrderList />
    </PermissionGuard>
  )
}
