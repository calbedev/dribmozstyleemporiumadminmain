"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { usePermissions } from "./permission-guard"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Tag,
  ImageIcon,
  MessageSquare,
  Users,
  MapPin,
  Palette,
  Ruler,
  Hash,
  Store,
} from "lucide-react"
import { useStore } from "@/contexts/store-context"


const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    resource: "dashboard",
    action: "read",
  },
  {
    name: "Pedidos",
    href: "/admin/orders",
    icon: ShoppingCart,
    resource: "orders",
    action: "read",
  },
  {
    name: "Produtos",
    href: "/admin/products",
    icon: Package,
    resource: "products",
    action: "read",
  },
  {
    name: "Categorias",
    href: "/admin/categories",
    icon: FolderTree,
    resource: "categories",
    action: "read",
  },
  {
    name: "Marcas",
    href: "/admin/brands",
    icon: Tag,
    resource: "brands",
    action: "read",
  },
  {
    name: "Banners",
    href: "/admin/banners",
    icon: ImageIcon,
    resource: "banners",
    action: "read",
  },
  {
    name: "Reviews",
    href: "/admin/reviews",
    icon: MessageSquare,
    resource: "reviews",
    action: "read",
  },
  {
    name: "Usuários",
    href: "/admin/users",
    icon: Users,
    resource: "users",
    action: "read",
  },
  {
    name: "Lojas",
    href: "/admin/stores",
    icon: Store,
    resource: "stores",
    action: "read",
  },
  {
    name: "Bairros",
    href: "/admin/locations/neighborhoods",
    icon: MapPin,
    resource: "neighborhoods",
    action: "read",
  },
]

const attributesNav = [
  {
    name: "Cores",
    href: "/admin/attributes/colors",
    icon: Palette,
    resource: "colors",
    action: "read",
  },
  {
    name: "Tamanhos",
    href: "/admin/attributes/sizes",
    icon: Ruler,
    resource: "sizes",
    action: "read",
  },
  {
    name: "Tags",
    href: "/admin/attributes/tags",
    icon: Hash,
    resource: "tags",
    action: "read",
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { userRole } = useStore()
  const { can } = usePermissions()
  if (!userRole) {
    return <div>Access denied</div>
  }

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-semibold">Admin Panel</h1>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          if (!can(userRole, item.action, item.resource)) return null

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                pathname === item.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </Link>
          )
        })}

        <div className="pt-4">
          <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Atributos</h3>
          <div className="mt-2 space-y-1">
            {attributesNav.map((item) => {
              if (!can(userRole, item.action, item.resource)) return null

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
