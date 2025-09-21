import { PermissionGuard } from "@/components/admin/permission-guard"
import { CategoryList } from "@/components/admin/categories/category-list"

export default function CategoriesPage() {
  return (
    <PermissionGuard action="read" resource="categories">
      <CategoryList />
    </PermissionGuard>
  )
}
