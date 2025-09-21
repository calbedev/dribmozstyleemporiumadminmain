import { PermissionGuard } from "@/components/admin/permission-guard"
import { ColorsList } from "@/components/admin/attributes/colors-list"

export default function ColorsPage() {
  return (
    <PermissionGuard action="read" resource="colors">
      <ColorsList />
    </PermissionGuard>
  )
}
