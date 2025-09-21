import { PermissionGuard } from "@/components/admin/permission-guard"
import { SizeList } from "@/components/admin/attributes/size-list"

export default function SizesPage() {
  return (
    <PermissionGuard action="read" resource="attributes">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tamanhos</h1>
          <p className="text-muted-foreground">Gerencie os tamanhos disponíveis para os produtos</p>
        </div>
        <SizeList />
      </div>
    </PermissionGuard>
  )
}
