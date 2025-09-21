import { PermissionGuard } from "@/components/admin/permission-guard"
import { ProductDetail } from "@/components/admin/products/product-details"
import { Id } from "@/convex/_generated/dataModel"

interface ProductDetailPageProps {
  params: {
    id: Id<"Product">
  }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <PermissionGuard action="read" resource="reviews">
      <ProductDetail id={params.id} />
    </PermissionGuard>
  )
}
