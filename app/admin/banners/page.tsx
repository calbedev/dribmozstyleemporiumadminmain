import { PermissionGuard } from "@/components/admin/permission-guard"
import { BannerList } from "@/components/admin/banners/banner-list"

export default function BannersPage() {
  return (
    <PermissionGuard action="read" resource="banners">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-muted-foreground">Gerencie os banners promocionais da loja</p>
        </div>
        <BannerList />
      </div>
    </PermissionGuard>
  )
}
