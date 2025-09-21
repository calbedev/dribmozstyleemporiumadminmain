import { PermissionGuard } from "@/components/admin/permission-guard"
import { StoreList } from "@/components/admin/stores/store-list"

export default function StoresPage() {
  return (
    <PermissionGuard action="read" resource="stores">
      <StoreList />
    </PermissionGuard>
  )
}
