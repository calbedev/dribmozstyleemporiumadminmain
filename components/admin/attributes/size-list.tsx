"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Edit, Trash2, Ruler } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function SizeList() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSize, setEditingSize] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "clothing" as "clothing" | "shoes" | "accessories",
    sortOrder: 0,
  })

  const sizes = useQuery(api.adminattributes.getSizes, {
    search: searchTerm,
    isActive: true,
    category: formData.category,
  })
  const createSize = useMutation(api.adminattributes.createSize)
  const updateSize = useMutation(api.adminattributes.updateSize)
  const deleteSize = useMutation(api.adminattributes.deleteSize)

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingSize) {
        await updateSize({
          id: editingSize._id,
          ...formData,
        })
        toast({
          title: "Sucesso",
          description: "Tamanho atualizado com sucesso",
        })
      } else {
        await createSize(formData)
        toast({
          title: "Sucesso",
          description: "Tamanho criado com sucesso",
        })
      }

      setIsDialogOpen(false)
      setEditingSize(null)
      setFormData({ name: "", category: "clothing", sortOrder: 0 })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar tamanho",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (size: any) => {
    setEditingSize(size)
    setFormData({
      name: size.name,
      category: size.category,
      sortOrder: size.sortOrder,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este tamanho?")) return

    try {
      await deleteSize({ id: id as any })
      toast({
        title: "Sucesso",
        description: "Tamanho excluído com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir tamanho",
        variant: "destructive",
      })
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "clothing":
        return "Roupas"
      case "shoes":
        return "Calçados"
      case "accessories":
        return "Acessórios"
      default:
        return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "clothing":
        return "default"
      case "shoes":
        return "secondary"
      case "accessories":
        return "outline"
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tamanhos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingSize(null)
                setFormData({ name: "", category: "clothing", sortOrder: 0 })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Tamanho
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSize ? "Editar Tamanho" : "Novo Tamanho"}</DialogTitle>
              <DialogDescription>
                {editingSize ? "Edite as informações do tamanho" : "Adicione um novo tamanho ao sistema"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: P, M, G, 38, 40..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: "clothing" | "shoes" | "accessories") =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clothing">Roupas</SelectItem>
                      <SelectItem value="shoes">Calçados</SelectItem>
                      <SelectItem value="accessories">Acessórios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Ordem de Exibição</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        sortOrder: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingSize ? "Atualizar" : "Criar"} Tamanho</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sizes?.sizes?.map((size) => (
          <Card key={size._id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{size.name}</CardTitle>
                <Badge variant={getCategoryColor(size.category)}>{getCategoryLabel(size.category)}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Ordem: {size.sortOrder}</div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(size)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(size._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sizes?.sizes?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ruler className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum tamanho encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">Comece adicionando tamanhos para seus produtos</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Tamanho
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
