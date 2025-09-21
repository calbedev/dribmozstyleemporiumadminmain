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
import { Search, Plus, MoreHorizontal, Edit, Trash2, FolderTree } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export function CategoryList() {
  const [search, setSearch] = useState("")
  const { can } = usePermissions()
  const { toast } = useToast()

  const categories = useQuery(api.admincategories.list, { search: search || undefined })
  const deleteCategory = useMutation(api.admincategories.remove)

  const handleDelete = async (categoryId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return

    try {
      await deleteCategory({ id: categoryId as any })
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao excluir categoria",
        variant: "destructive",
      })
    }
  }

  if (categories === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
          <CardDescription>Carregando categorias...</CardDescription>
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
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">Organize seus produtos em categorias</p>
        </div>
        {can("write", "categories") && (
          <Button asChild>
            <Link href="/admin/categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
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
                placeholder="Buscar categorias..."
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
                <TableHead>Categoria</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Pai</TableHead>
                <TableHead>Subcategorias</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.categories.map((category) => (
                <TableRow key={category._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {category.image && (
                        <img
                          src={category.image || "/placeholder.svg"}
                          alt={category.name}
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">{category.description}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{category.slug}</code>
                  </TableCell>
                  <TableCell>{category.parent?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{category.childCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.isActive ? "default" : "secondary"}>
                      {category.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        {can("write", "categories") && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/categories/${category._id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {can("delete", "categories") && (
                          <DropdownMenuItem onClick={() => handleDelete(category._id)} className="text-destructive">
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

          {categories.categories.length === 0 && (
            <div className="text-center py-8">
              <FolderTree className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Nenhuma categoria encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
