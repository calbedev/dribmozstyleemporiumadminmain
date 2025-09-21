"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { usePermissions } from "@/components/admin/permission-guard"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Palette } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useStore } from "@/contexts/store-context"

export function ColorsList() {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingColor, setEditingColor] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    hexCode: "#000000",
    isActive: true,
  })

  const { can } = usePermissions()
  const { userRole } = useStore()
    if (!userRole) {
      return <div>Access denied</div>
    }
  const { toast } = useToast()

  const colors = useQuery(api.adminattributes.listColors, { search: search || undefined, isActive: true })
  const createColor = useMutation(api.adminattributes.createColor)
  const updateColor = useMutation(api.adminattributes.updateColor)
  const deleteColor = useMutation(api.adminattributes.removeColor)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingColor) {
        await updateColor({ id: editingColor._id, ...formData })
        toast({ title: "Sucesso", description: "Cor atualizada com sucesso" })
      } else {
        await createColor(formData)
        toast({ title: "Sucesso", description: "Cor criada com sucesso" })
      }
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar cor",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (color: any) => {
    setEditingColor(color)
    setFormData({
      name: color.name,
      hexCode: color.hexCode,
      isActive: color.isActive,
    })
    setDialogOpen(true)
  }

  const handleDelete = async (colorId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta cor?")) return

    try {
      await deleteColor({ id: colorId as any })
      toast({ title: "Sucesso", description: "Cor excluída com sucesso" })
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao excluir cor",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setEditingColor(null)
    setFormData({
      name: "",
      hexCode: "#000000",
      isActive: true,
    })
  }

  if (colors === undefined) {
    return <div>Carregando...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cores</h1>
          <p className="text-muted-foreground">Gerencie as cores disponíveis para produtos</p>
        </div>
        {can(userRole, "write", "colors") && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Cor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingColor ? "Editar Cor" : "Nova Cor"}</DialogTitle>
                <DialogDescription>
                  {editingColor ? "Edite as informações da cor" : "Adicione uma nova cor ao catálogo"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Cor</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hexCode">Código Hexadecimal</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="hexCode"
                      type="color"
                      value={formData.hexCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hexCode: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={formData.hexCode}
                      onChange={(e) => setFormData((prev) => ({ ...prev, hexCode: e.target.value }))}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Cor Ativa</Label>
                    <div className="text-sm text-muted-foreground">Cor disponível para uso</div>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingColor ? "Atualizar" : "Criar"} Cor</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cores..."
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
                <TableHead>Cor</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Código Hex</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colors.colors.map((color) => (
                <TableRow key={color._id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: color.hexCode }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{color.name}</TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">{color.hexCode}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={color.isActive ? "default" : "secondary"}>
                      {color.isActive ? "Ativo" : "Inativo"}
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
                        {can(userRole,"write", "colors") && (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(color)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {can(userRole,"delete", "colors") && (
                          <DropdownMenuItem onClick={() => handleDelete(color._id)} className="text-destructive">
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

          {colors.colors.length === 0 && (
            <div className="text-center py-8">
              <Palette className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Nenhuma cor encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
