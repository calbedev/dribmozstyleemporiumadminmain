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
import { Checkbox } from "@/components/ui/checkbox"
import { usePermissions } from "@/components/admin/permission-guard"
import { Search, Plus, MoreHorizontal, Edit, Eye, Trash2, Power, PowerOff } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import { useStore } from "@/contexts/store-context"

export function ProductList() {
  const { selectedStore, isLoading } = useStore()
  const [search, setSearch] = useState("")
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const { can } = usePermissions()
  const { toast } = useToast()

  const storeId = selectedStore?._id as Id<"stores">

  const products = useQuery(api.adminproducts.list, {
    search: search || undefined,
    storeId: storeId,
    limit: 50,
  })
  const togglePublished = useMutation(api.adminproducts.togglePublished)
  const deleteProduct = useMutation(api.adminproducts.remove)

  const handleTogglePublished = async (productId: string) => {
    try {
      await togglePublished({ id: productId as any, storeId })
      toast({
        title: "Sucesso",
        description: "Status de publicação atualizado",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return

    try {
      await deleteProduct({ id: productId as any, storeId })
      toast({
        title: "Sucesso",
        description: "Produto excluído com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir produto",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "MZN",
    }).format(value)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
          <CardDescription>Carregando dados da loja...</CardDescription>
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

  if (!selectedStore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
          <CardDescription>Nenhuma loja selecionada</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Selecione uma loja no cabeçalho para visualizar os produtos.</p>
        </CardContent>
      </Card>
    )
  }

  if (products === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
          <CardDescription>Carregando produtos...</CardDescription>
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
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie os produtos da loja: <span className="font-medium">{selectedStore.name}</span>
          </p>
        </div>
        {can("write", "products") && (
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
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
                placeholder="Buscar produtos..."
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
                <TableHead className="w-12">
                  <Checkbox />
                </TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Marca</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variações</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <img
                        src={product.thumbnail || "/placeholder.svg?height=40&width=40"}
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.slug}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category || "-"}</TableCell>
                  <TableCell>{product.brand || "-"}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatCurrency(product.price)}</div>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatCurrency(product.originalPrice)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{product.stockCount}</span>
                      {product.stockCount <= product.minStock && (
                        <Badge variant="destructive" className="text-xs">
                          Baixo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant={product.isPublished ? "default" : "secondary"}>
                        {product.isPublished ? "Publicado" : "Rascunho"}
                      </Badge>
                      {product.isFeatured && (
                        <Badge variant="outline" className="text-xs">
                          Destaque
                        </Badge>
                      )}
                      {product.isNew && (
                        <Badge variant="outline" className="text-xs">
                          Novo
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.variantCount}</Badge>
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
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/products/${product._id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </Link>
                        </DropdownMenuItem>
                        {can("write", "products") && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/products/${product._id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleTogglePublished(product._id)}>
                              {product.isPublished ? (
                                <>
                                  <PowerOff className="mr-2 h-4 w-4" />
                                  Despublicar
                                </>
                              ) : (
                                <>
                                  <Power className="mr-2 h-4 w-4" />
                                  Publicar
                                </>
                              )}
                            </DropdownMenuItem>
                          </>
                        )}
                        {can("delete", "products") && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(product._id)} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {products.products.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum produto encontrado nesta loja</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
