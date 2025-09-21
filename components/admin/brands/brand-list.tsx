"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePermissions } from "@/components/admin/permission-guard"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Tag, ExternalLink } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useStore } from "@/contexts/store-context"

export function BrandList() {
  const [search, setSearch] = useState("")
  const { can } = usePermissions()
  const { userRole } = useStore()
  if (!userRole) {
    return <div>Access denied</div>
  }
  const { toast } = useToast()

  const brands = useQuery(api.adminbrands.list, { search: search || undefined })
  const deleteBrand = useMutation(api.adminbrands.remove)

  const handleDelete = async (brandId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta marca?")) return

    try {
      await deleteBrand({ id: brandId as any })
      toast({
        title: "Sucesso",
        description: "Marca excluída com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao excluir marca",
        variant: "destructive",
      })
    }
  }

  if (brands === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marcas</CardTitle>
          <CardDescription>Carregando marcas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marcas</h1>
          <p className="text-muted-foreground">Gerencie as marcas dos seus produtos</p>
        </div>
        {can(userRole,"write", "brands") && (
          <Button asChild>
            <Link href="/admin/brands/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Marca
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar marcas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marca</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.brands.map((brand) => (
                <TableRow key={brand._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {brand.logo && (
                        <img
                          src={brand.logo || "/placeholder.svg"}
                          alt={brand.name}
                          className="h-10 w-10 rounded object-contain"
                        />
                      )}
                      <div>
                        <div className="font-medium">{brand.name}</div>
                        {brand.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">{brand.description}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{brand.slug}</code>
                  </TableCell>
                  <TableCell>
                    {brand.website ? (
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Website
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{brand.productCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={brand.isActive ? "default" : "secondary"}>
                      {brand.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        {can(userRole,"write", "brands") && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/brands/${brand._id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {can(userRole,"delete", "brands") && (
                          <DropdownMenuItem onClick={() => handleDelete(brand._id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {brands.brands.length === 0 && (
            <div className="text-center py-8">
              <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Nenhuma marca encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
