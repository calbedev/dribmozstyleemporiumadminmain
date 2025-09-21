"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { nanoid } from "nanoid" // Importa o nanoid

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Save, ArrowLeft, Plus, Trash2, Upload, X } from "lucide-react"
import Link from "next/link"
import { useStore } from "@/contexts/store-context"
import { Id } from "@/convex/_generated/dataModel"

// ... (interfaces ProductFormProps e ProductVariant permanecem as mesmas)
interface ProductFormProps {
  productId?: string
  mode: "create" | "edit"
}

interface ProductVariant {
  id: string
  colorId: string
  sizeId: string
  sku: string
  price: number
  stockCount: number
  images: string[]
}


export function ProductForm({ productId, mode }: ProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { selectedStore, isLoading } = useStore()
  const storeId = selectedStore?._id as Id<"stores">

  const product = useQuery(api.adminproducts.getById, productId ? { id: productId as any, storeId } : "skip")
  const categories = useQuery(api.admincategories.list, { isActive: true })
  const brands = useQuery(api.adminbrands.list, { isActive: true })
  const colors = useQuery(api.adminattributes.getColors, { isActive: true })
  
  // Use o novo ficheiro para as mutations
  const createProduct = useMutation(api.adminproductform.createProduct)
  const updateProduct = useMutation(api.adminproductform.updateProduct)
  const uploadProductImage = useMutation(api.adminproductform.uploadProductImage)

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    shortDesc: "",
    price: 0,
    originalPrice: 0,
    images: [] as string[],
    thumbnail: "",
    categoryId: "",
    brandId: "",
    stockCount: 0,
    minStock: 5,
    metaTitle: "",
    metaDesc: "",
    isNew: false,
    isFeatured: false,
    isPublished: false,
  })

  const sizes = useQuery(api.attributes.getSizes, {
    isActive: true,
    category: formData.categoryId,
  })

  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false) // Estado para o upload

  // Lógica para preencher o formulário no modo de edição
  useEffect(() => {
    if (product && mode === "edit") {
      setFormData({
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDesc: product.shortDesc || "",
        price: product.price,
        originalPrice: product.originalPrice || 0,
        images: product.images,
        thumbnail: product.thumbnail,
        categoryId: product.categoryId,
        brandId: product.brandId || "",
        stockCount: product.stockCount,
        minStock: product.minStock,
        metaTitle: product.metaTitle || "",
        metaDesc: product.metaDesc || "",
        isNew: product.isNew,
        isFeatured: product.isFeatured,
        isPublished: product.isPublished,
      })
      // Ajuste para garantir que as variantes do backend sejam compatíveis com o estado local
      const formattedVariants = (product.variants || []).map(v => ({...v, id: nanoid()}))
      setVariants(formattedVariants)
    }
  }, [product, mode])

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

  // NOVA LÓGICA: Atualiza slug quando o nome muda
  useEffect(() => {
    if (mode === "create") {
      setFormData((prev) => ({ ...prev, slug: generateSlug(prev.name) }))
    }
  }, [formData.name, mode])

  // NOVA LÓGICA: Gera descrição curta automaticamente
  useEffect(() => {
    if (formData.description.length > 0) {
      const autoShortDesc = formData.description.substring(0, 150)
      if (formData.shortDesc === "" || formData.shortDesc === autoShortDesc.substring(0, formData.shortDesc.length)) {
        setFormData((prev) => ({ ...prev, shortDesc: autoShortDesc }))
      }
    }
  }, [formData.description])
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.thumbnail) {
      toast({ title: "Erro de Validação", description: "Por favor, defina uma imagem principal.", variant: "destructive" });
      return;
    }
    setLoading(true)

    try {
      if (mode === "create") {
        await createProduct({
          ...formData,
          storeId,
          variants: variants.map(({ id, ...rest }) => rest), // Remove o 'id' local
        })
        toast({ title: "Sucesso", description: "Produto criado com sucesso" })
      } else {
        await updateProduct({
          id: productId as any,
          ...formData,
          storeId,
          variants: variants.map(({ id, ...rest }) => rest), // Remove o 'id' local
        })
        toast({ title: "Sucesso", description: "Produto atualizado com sucesso" })
      }
      router.push("/admin/products")
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar produto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // NOVA LÓGICA: Upload de Imagens
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    setUploading(true);
    
    const files = Array.from(event.target.files);
    
    try {
      const uploadPromises = files.map(file => 
        uploadProductImage({ imageFile: file })
      );
      const storageIds = await Promise.all(uploadPromises);
      
      // Converte storageIds para strings para armazenar no estado
      const storageIdStrings = storageIds.map((id: { toString: () => any }) => id.toString());
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...storageIdStrings],
        thumbnail: prev.thumbnail || storageIdStrings[0] || "",
      }));
      
    } catch (error) {
      toast({ title: "Erro no Upload", description: "Falha ao carregar imagens.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }

  const removeImage = (urlToRemove: string) => {
    setFormData(prev => {
      const newImages = prev.images.filter(url => url !== urlToRemove);
      return {
        ...prev,
        images: newImages,
        thumbnail: prev.thumbnail === urlToRemove ? newImages[0] || "" : prev.thumbnail, // Reseta o thumbnail se ele for removido
      };
    });
  }

  // NOVA LÓGICA: SKU automático ao adicionar variante
  const addVariant = () => {
    const slugPart = formData.slug.substring(0, 5).toUpperCase();
    const newVariant: ProductVariant = {
      id: nanoid(),
      colorId: "",
      sizeId: "",
      sku: `${slugPart}-${nanoid(6).toUpperCase()}`, // Ex: PROD1-A4B7C1
      price: formData.price,
      stockCount: 0,
      images: [],
    }
    setVariants([...variants, newVariant])
  }

  const removeVariant = (id: string) => setVariants(variants.filter((v) => v.id !== id))
  const updateVariant = (id: string, updates: Partial<ProductVariant>) => setVariants(variants.map((v) => (v.id === id ? { ...v, ...updates } : v)))

  // ... (o JSX para carregamento inicial pode permanecer o mesmo)

  return (
    <div className="space-y-6">
       {/* ... (o cabeçalho da página permanece o mesmo) */}
      <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/products">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {mode === "create" ? "Novo Produto" : "Editar Produto"}
              </h1>
              <p className="text-muted-foreground">
                {mode === "create" ? "Adicione um novo produto ao catálogo" : "Edite as informações do produto"}
              </p>
            </div>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* ... (Card de Informações Básicas permanece o mesmo, mas agora com slug e shortDesc automáticos) */}
             <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>Detalhes principais do produto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Produto</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input id="slug" value={formData.slug} onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))} rows={4} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shortDesc">Descrição Curta</Label>
                  <Textarea id="shortDesc" value={formData.shortDesc} onChange={(e) => setFormData((prev) => ({ ...prev, shortDesc: e.target.value }))} rows={2} />
                </div>
              </CardContent>
            </Card>

            {/* NOVO CARD DE IMAGENS */}
            <Card>
              <CardHeader>
                <CardTitle>Imagens do Produto</CardTitle>
                <CardDescription>Faça upload das imagens e defina a principal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="product-images">Carregar Imagens</Label>
                  <div className="flex gap-2">
                    <Input id="product-images" type="file" multiple onChange={handleImageUpload} className="flex-1" disabled={uploading}/>
                    <Button type="button" disabled={uploading}><Upload className="mr-2 h-4 w-4"/> {uploading ? 'Carregando...' : 'Enviar'}</Button>
                  </div>
                </div>
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {formData.images.map(url => (
                      <div key={url} className="relative group">
                        <img src={url} alt="Preview" className={`w-full h-auto aspect-square object-cover rounded-md border-2 ${formData.thumbnail === url ? 'border-primary' : 'border-transparent'}`}/>
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button type="button" size="sm" onClick={() => setFormData(prev => ({...prev, thumbnail: url}))} className="mb-1 w-24">Principal</Button>
                          <Button type="button" variant="destructive" size="icon" onClick={() => removeImage(url)} className="absolute top-1 right-1 h-6 w-6"><X className="h-4 w-4"/></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ... (Card de Preços e Estoque permanece o mesmo) */}
             <Card>
              <CardHeader>
                <CardTitle>Preços e Estoque</CardTitle>
                <CardDescription>Configurações de preço e inventário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço</Label>
                    <Input id="price" type="number" step="0.01" min="0" value={formData.price} onChange={(e) => setFormData((prev) => ({ ...prev, price: Number.parseFloat(e.target.value) || 0 })) } required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Preço Original</Label>
                    <Input id="originalPrice" type="number" step="0.01" min="0" value={formData.originalPrice} onChange={(e) => setFormData((prev) => ({ ...prev, originalPrice: Number.parseFloat(e.target.value) || 0 })) } />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stockCount">Quantidade em Estoque</Label>
                    <Input id="stockCount" type="number" min="0" value={formData.stockCount} onChange={(e) => setFormData((prev) => ({ ...prev, stockCount: Number.parseInt(e.target.value) || 0 }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Estoque Mínimo</Label>
                    <Input id="minStock" type="number" min="0" value={formData.minStock} onChange={(e) => setFormData((prev) => ({ ...prev, minStock: Number.parseInt(e.target.value) || 0 }))} required />
                  </div>
                </div>
              </CardContent>
            </Card>


            {/* ... (Card de Variantes permanece o mesmo, mas agora com SKU automático) */}
              <Card>
              <CardHeader>
                <CardTitle>Variantes do Produto</CardTitle>
                <CardDescription>Gerencie cores, tamanhos e preços específicos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">{variants.length} variante(s) configurada(s)</p>
                  <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Variante
                  </Button>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div key={variant.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Variante {index + 1}</h4>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeVariant(variant.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Cor</Label>
                            <Select
                              value={variant.colorId}
                              onValueChange={(value) => updateVariant(variant.id, { colorId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar cor" />
                              </SelectTrigger>
                              <SelectContent>
                                {colors?.colors?.map((color) => (
                                  <SelectItem key={color._id} value={color._id}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-4 h-4 rounded-full border"
                                        style={{ backgroundColor: color.hexCode }}
                                      />
                                      {color.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Tamanho</Label>
                            <Select
                              value={variant.sizeId}
                              onValueChange={(value) => updateVariant(variant.id, { sizeId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecionar tamanho" />
                              </SelectTrigger>
                              <SelectContent>
                                {sizes?.sizes?.map((size) => (
                                  <SelectItem key={size._id} value={size._id}>
                                    {size.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="space-y-2">
                            <Label>SKU</Label>
                            <Input
                              value={variant.sku}
                              onChange={(e) => updateVariant(variant.id, { sku: e.target.value })}
                              placeholder="SKU único"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Preço</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={variant.price}
                              onChange={(e) =>
                                updateVariant(variant.id, { price: Number.parseFloat(e.target.value) || 0 })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Estoque</Label>
                            <Input
                              type="number"
                              min="0"
                              value={variant.stockCount}
                              onChange={(e) =>
                                updateVariant(variant.id, { stockCount: Number.parseInt(e.target.value) || 0 })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          <div className="space-y-6">
            {/* ... (Cards de Organização, Status e o botão de Salvar permanecem os mesmos) */}
             <Card>
              <CardHeader>
                <CardTitle>Organização</CardTitle>
                <CardDescription>Categoria e marca do produto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, categoryId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.categories?.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Select
                    value={formData.brandId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, brandId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands?.brands?.map((brand) => (
                        <SelectItem key={brand._id} value={brand._id}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
                <CardDescription>Configurações de publicação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isPublished">Publicado</Label>
                    <div className="text-sm text-muted-foreground">Produto visível na loja</div>
                  </div>
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isPublished: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isFeatured">Produto em Destaque</Label>
                    <div className="text-sm text-muted-foreground">Exibir em seções especiais</div>
                  </div>
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFeatured: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="isNew">Produto Novo</Label>
                    <div className="text-sm text-muted-foreground">Marcar como novidade</div>
                  </div>
                  <Switch
                    id="isNew"
                    checked={formData.isNew}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isNew: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : "Salvar Produto"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}