"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Edit, Trash2, Tag } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function TagList() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<any>(null)

  const tags = useQuery(api.adminattributes.getTags, { search: searchTerm, isActive: true })
  const createTag = useMutation(api.adminattributes.createTag)
  const updateTag = useMutation(api.adminattributes.updateTag)
  const deleteTag = useMutation(api.adminattributes.deleteTags)

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    color: "#3b82f6",
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingTag) {
        await updateTag({
          id: editingTag._id,
          ...formData,
        })
        toast({
          title: "Sucesso",
          description: "Tag atualizada com sucesso",
        })
      } else {
        await createTag(formData)
        toast({
          title: "Sucesso",
          description: "Tag criada com sucesso",
        })
      }

      setIsDialogOpen(false)
      setEditingTag(null)
      setFormData({ name: "", slug: "", color: "#3b82f6" })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar tag",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (tag: any) => {
    setEditingTag(tag)
    setFormData({
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta tag?")) return

    try {
      await deleteTag({ id: id as any })
      toast({
        title: "Sucesso",
        description: "Tag excluída com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir tag",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tags..."
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
                setEditingTag(null)
                setFormData({ name: "", slug: "", color: "#3b82f6" })
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTag ? "Editar Tag" : "Nova Tag"}</DialogTitle>
              <DialogDescription>
                {editingTag ? "Edite as informações da tag" : "Adicione uma nova tag ao sistema"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ex: Novidade, Promoção, Verão..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="novidade, promocao, verao..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Cor</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="color"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-16 h-10 p-1 border rounded"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editingTag ? "Atualizar" : "Criar"} Tag</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tags?.tags?.map((tag) => (
          <Card key={tag._id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: tag.color }} />
                  {tag.name}
                </CardTitle>
              </div>
              <CardDescription>/{tag.slug}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge style={{ backgroundColor: tag.color, color: "white" }}>{tag.name}</Badge>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(tag)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(tag._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tags?.tags?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Tag className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma tag encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece adicionando tags para organizar seus produtos
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Tag
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
