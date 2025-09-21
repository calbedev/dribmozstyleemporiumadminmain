import { PermissionGuard } from "@/components/admin/permission-guard"
import { ProductForm } from "@/components/admin/products/product-form"

export default function NewProductPage() {
  return (
    <PermissionGuard action="write" resource="products">
      <ProductForm mode="create" />
    </PermissionGuard>
  )
}
