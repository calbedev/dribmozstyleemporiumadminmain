"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Plus, Search, Edit, Trash2, ImageIcon } from "lucide-react"
import Link from "next/link"

export function BannerList() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")

  const banners = useQuery(api.adminbanners.list, { search: searchTerm })
  const toggleBanner = useMutation(api.adminbanners.toggle)
  const deleteBanner = useMutation(api.adminbanners.remove)

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleBanner({ id: id as any, isActive })
      toast({
        title: "Sucesso",
        description: `Banner ${isActive ? "ativado" : "desativado"} com sucesso`,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar banner",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este banner?")) return

    try {
      await deleteBanner({ id: id as any })
      toast({
        title: "Sucesso",
        description: "Banner excluído com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir banner",
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
              placeholder="Buscar banners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/banners/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo Banner
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {banners?.banners?.map((banner) => (
          <Card key={banner._id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{banner.title}</CardTitle>
                <Badge variant={banner.isActive ? "default" : "secondary"}>
                  {banner.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <CardDescription>{banner.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {banner.imageUrl && (
                <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                  <img
                    src={banner.imageUrl || "/placeholder.svg"}
                    alt={banner.title}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Posição:</span>
                  <span className="font-medium">{banner.position}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ordem:</span>
                  <span className="font-medium">{banner.sortOrder}</span>
                </div>
                {banner.linkUrl && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Link:</span>
                    <span className="font-medium truncate max-w-[150px]">{banner.linkUrl}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <Switch checked={banner.isActive} onCheckedChange={(checked) => handleToggle(banner._id, checked)} />
                  <span className="text-sm">Ativo</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/banners/${banner._id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(banner._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {banners?.banners?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum banner encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">Comece criando seu primeiro banner promocional</p>
            <Button asChild>
              <Link href="/admin/banners/new">
                <Plus className="mr-2 h-4 w-4" />
                Criar Banner
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
