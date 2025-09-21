"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface CategoryFormProps {
  categoryId?: string
  mode: "create" | "edit"
}

export function CategoryForm({ categoryId, mode }: CategoryFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const category = useQuery(api.admincategories.getById, categoryId ? { id: categoryId as any } : "skip")
  const categories = useQuery(api.admincategories.list, { isActive: true })

  const createCategory = useMutation(api.admincategories.create)
  const updateCategory = useMutation(api.admincategories.update)

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    parentId: "",
    metaTitle: "",
    metaDesc: "",
    isActive: true,
    sortOrder: 0,
  })

  const [loading, setLoading] = useState(false)

  // Update form data when category loads
  useEffect(() => {
    if (category && mode === "edit") {
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        image: category.image || "",
        parentId: category.parentId || "",
        metaTitle: category.metaTitle || "",
        metaDesc: category.metaDesc || "",
        isActive: category.isActive,
        sortOrder: category.sortOrder,
      })
    }
  }, [category, mode])

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
    setLoading(true)

    try {
      if (mode === "create") {
        await createCategory({
          ...formData,
          parentId: formData.parentId ? (formData.parentId as any) : undefined,
        })
        toast({
          title: "Sucesso",
          description: "Categoria criada com sucesso",
        })
      } else {
        await updateCategory({
          id: categoryId as any,
          ...formData,
          parentId: formData.parentId ? (formData.parentId as any) : undefined,
        })
        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso",
        })
      }
      router.push("/admin/categories")
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar categoria",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (mode === "edit" && category === undefined) {
    return <div>Carregando...</div>
  }

  // Filter out current category and its descendants from parent options
  const parentOptions = categories?.categories.filter((cat) => cat._id !== categoryId) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/categories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? "Nova Categoria" : "Editar Categoria"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create" ? "Adicione uma nova categoria" : "Edite as informações da categoria"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Detalhes principais da categoria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome da Categoria</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">URL da Imagem</Label>
                  <Input
                    id="image"
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
                <CardDescription>Otimização para mecanismos de busca</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Título Meta</Label>
                  <Input
                    id="metaTitle"
                    value={formData.metaTitle}
                    onChange={(e) => setFormData((prev) => ({ ...prev, metaTitle: e.target.value }))}
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">Recomendado: até 60 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaDesc">Descrição Meta</Label>
                  <Textarea
                    id="metaDesc"
                    value={formData.metaDesc}
                    onChange={(e) => setFormData((prev) => ({ ...prev, metaDesc: e.target.value }))}
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">Recomendado: até 160 caracteres</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organização</CardTitle>
                <CardDescription>Hierarquia e ordenação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="parent">Categoria Pai</Label>
                  <Select
                    value={formData.parentId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, parentId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria pai (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (categoria raiz)</SelectItem>
                      {parentOptions.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Ordem de Exibição</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="0"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, sortOrder: Number.parseInt(e.target.value) || 0 }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Configurações de visibilidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isActive">Categoria Ativa</Label>
                    <div className="text-sm text-muted-foreground">Categoria visível na loja</div>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : "Salvar Categoria"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
