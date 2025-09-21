import { PermissionGuard } from "@/components/admin/permission-guard"
import { CategoryForm } from "@/components/admin/categories/category-form"

export default function NewCategoryPage() {
  return (
    <PermissionGuard action="write" resource="categories">
      <CategoryForm mode="create" />
    </PermissionGuard>
  )
}
