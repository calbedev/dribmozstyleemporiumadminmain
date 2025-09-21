import { PermissionGuard } from "@/components/admin/permission-guard"
import { CategoryForm } from "@/components/admin/categories/category-form"

interface EditCategoryPageProps {
  params: { id: string }
}

export default function EditCategoryPage({ params }: EditCategoryPageProps) {
  return (
    <PermissionGuard action="write" resource="categories">
      <CategoryForm categoryId={params.id} mode="edit" />
    </PermissionGuard>
  )
}
