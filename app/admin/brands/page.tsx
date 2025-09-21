import { PermissionGuard } from "@/components/admin/permission-guard"
import { BrandList } from "@/components/admin/brands/brand-list"

export default function BrandsPage() {
  return (
    <PermissionGuard action="read" resource="brands">
      <BrandList />
    </PermissionGuard>
  )
}
