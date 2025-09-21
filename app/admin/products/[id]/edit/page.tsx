import { PermissionGuard } from "@/components/admin/permission-guard"
import { ProductForm } from "@/components/admin/products/product-form"

interface EditProductPageProps {
  params: { id: string }
}

export default function EditProductPage({ params }: EditProductPageProps) {
  return (
    <PermissionGuard action="write" resource="products">
      <ProductForm productId={params.id} mode="edit" />
    </PermissionGuard>
  )
}
