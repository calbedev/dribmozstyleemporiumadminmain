import { PermissionGuard } from "@/components/admin/permission-guard"
import { NeighborhoodList } from "@/components/admin/locations/neighborhood-list"

export default function NeighborhoodsPage() {
  return (
    <PermissionGuard action="read" resource="locations">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bairros</h1>
          <p className="text-muted-foreground">Gerencie os bairros de entrega e suas taxas</p>
        </div>
        <NeighborhoodList />
      </div>
    </PermissionGuard>
  )
}
