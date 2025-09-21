import { PermissionGuard } from "@/components/admin/permission-guard"
import { TeamMemberList } from "@/components/admin/users/team-member-list"

export default function UsersPage() {
  return (
    <PermissionGuard action="read" resource="users">
      <TeamMemberList />
    </PermissionGuard>
  )
}
