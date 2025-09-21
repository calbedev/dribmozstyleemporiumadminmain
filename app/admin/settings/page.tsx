import { PermissionGuard } from "@/components/admin/permission-guard"
import { SettingsForm } from "@/components/admin/settings/settings-form"

export default function SettingsPage() {
  return (
    <PermissionGuard requiredPermissions={["manage_settings"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Configure as informações gerais da sua loja</p>
        </div>

        <SettingsForm />
      </div>
    </PermissionGuard>
  )
}
