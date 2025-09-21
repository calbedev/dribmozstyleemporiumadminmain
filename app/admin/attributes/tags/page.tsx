import { PermissionGuard } from "@/components/admin/permission-guard"
import { TagList } from "@/components/admin/attributes/tag-list"

export default function TagsPage() {
  return (
    <PermissionGuard action="read" resource="attributes">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tags</h1>
          <p className="text-muted-foreground">Gerencie as tags para categorização de produtos</p>
        </div>
        <TagList />
      </div>
    </PermissionGuard>
  )
}
