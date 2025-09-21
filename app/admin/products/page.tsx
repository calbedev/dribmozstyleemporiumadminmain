import { PermissionGuard } from "@/components/admin/permission-guard"
import { ProductList } from "@/components/admin/products/product-list"

export default function ProductsPage() {
  return (
    <PermissionGuard action="read" resource="products">
      <ProductList />
    </PermissionGuard>
  )
}
