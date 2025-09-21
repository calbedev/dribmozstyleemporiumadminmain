import { PermissionGuard } from "@/components/admin/permission-guard"
import { NeighborhoodList } from "@/components/admin/locations/neighborhood-list"

export default function LocationsPage() {
  return (
    <PermissionGuard requiredPermissions={["manage_locations"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Localização</h1>
          <p className="text-muted-foreground">Gerencie bairros, cidades e taxas de entrega</p>
        </div>

        <NeighborhoodList />
      </div>
    </PermissionGuard>
  )
}
