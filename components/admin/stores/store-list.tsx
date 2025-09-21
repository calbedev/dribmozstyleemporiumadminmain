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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { usePermissions } from "@/components/admin/permission-guard"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Store, Users, Globe, Mail, Phone } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/contexts/store-context"

export function StoreList() {
  const [search, setSearch] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<any>(null)
  const { can } = usePermissions()
  const { userRole } = useStore()
  

  const stores = useQuery(api.adminstores.listStores, { search: search || undefined })

  const createStore = useMutation(api.adminstores.createStore)
  const updateStore = useMutation(api.adminstores.updateStore)
  const deleteStore = useMutation(api.adminstores.deleteStore)

  const [storeForm, setStoreForm] = useState({
    name: "",
    slug: "",
    description: "",
    logo: "",
    website: "",
    email: "",
    phone: "",
    address: "",
  })

  const resetForm = () => {
    setStoreForm({
      name: "",
      slug: "",
      description: "",
      logo: "",
      website: "",
      email: "",
      phone: "",
      address: "",
    })
  }

  const handleCreate = async () => {
    if (!storeForm.name || !storeForm.slug) {
      toast.error("Nome e slug são obrigatórios")
      return
    }

    try {
      await createStore(storeForm)
      toast.success("Loja criada com sucesso!")
      setIsCreateOpen(false)
      resetForm()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleUpdate = async () => {
    if (!editingStore || !storeForm.name || !storeForm.slug) {
      toast.error("Nome e slug são obrigatórios")
      return
    }

    try {
      await updateStore({
        storeId: editingStore._id,
        ...storeForm,
      })
      toast.success("Loja atualizada com sucesso!")
      setEditingStore(null)
      resetForm()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleDelete = async (storeId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta loja? Todos os membros serão removidos.")) return

    try {
      await deleteStore({ storeId: storeId as any })
      toast.success("Loja excluída com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const openEditDialog = (store: any) => {
    setEditingStore(store)
    setStoreForm({
      name: store.name || "",
      slug: store.slug || "",
      description: store.description || "",
      logo: store.logo || "",
      website: store.website || "",
      email: store.email || "",
      phone: store.phone || "",
      address: store.address || "",
    })
  }

  if (stores === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lojas</CardTitle>
          <CardDescription>Carregando lojas...</CardDescription>
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
  if (!userRole) {
    return <div>Access denied</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lojas</h1>
          <p className="text-muted-foreground">Gerencie todas as lojas da plataforma</p>
        </div>
        {can(userRole,"create", "stores") && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Loja
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Nova Loja</DialogTitle>
                <DialogDescription>Adicione uma nova loja à plataforma</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    placeholder="Nome da loja"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={storeForm.slug}
                    onChange={(e) =>
                      setStoreForm({ ...storeForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                    }
                    placeholder="slug-da-loja"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={storeForm.description}
                    onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                    placeholder="Descrição da loja"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={storeForm.email}
                    onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                    placeholder="contato@loja.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={storeForm.website}
                    onChange={(e) => setStoreForm({ ...storeForm, website: e.target.value })}
                    placeholder="https://loja.com"
                  />
                </div>
                <div>
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input
                    id="logo"
                    value={storeForm.logo}
                    onChange={(e) => setStoreForm({ ...storeForm, logo: e.target.value })}
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={storeForm.address}
                    onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                    placeholder="Endereço completo da loja"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Criar Loja</Button>
              </DialogFooter>
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
                placeholder="Buscar lojas por nome ou slug..."
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
                <TableHead>Loja</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Membros</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.stores.map((store) => (
                <TableRow key={store._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        {store.logo ? (
                          <img src={store.logo || "/placeholder.svg"} alt={store.name} className="h-8 w-8 rounded" />
                        ) : (
                          <Store className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{store.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center space-x-4">
                          {store.email && (
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {store.email}
                            </span>
                          )}
                          {store.phone && (
                            <span className="flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {store.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted px-2 py-1 rounded text-sm">{store.slug}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{store.memberCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={store.status === "active" ? "default" : "secondary"}>
                      {store.status === "active" ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(store.createdAt).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    {can(userRole,"update", "stores") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          {store.website && (
                            <DropdownMenuItem asChild>
                              <a href={store.website} target="_blank" rel="noopener noreferrer">
                                <Globe className="mr-2 h-4 w-4" />
                                Visitar Site
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openEditDialog(store)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(store._id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {stores.stores.length === 0 && (
            <div className="text-center py-8">
              <Store className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Nenhuma loja encontrada</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Store Dialog */}
      <Dialog
        open={!!editingStore}
        onOpenChange={() => {
          setEditingStore(null)
          resetForm()
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Loja</DialogTitle>
            <DialogDescription>Atualize as informações da loja {editingStore?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editName">Nome *</Label>
              <Input
                id="editName"
                value={storeForm.name}
                onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                placeholder="Nome da loja"
              />
            </div>
            <div>
              <Label htmlFor="editSlug">Slug *</Label>
              <Input
                id="editSlug"
                value={storeForm.slug}
                onChange={(e) =>
                  setStoreForm({ ...storeForm, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })
                }
                placeholder="slug-da-loja"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="editDescription">Descrição</Label>
              <Textarea
                id="editDescription"
                value={storeForm.description}
                onChange={(e) => setStoreForm({ ...storeForm, description: e.target.value })}
                placeholder="Descrição da loja"
              />
            </div>
            <div>
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={storeForm.email}
                onChange={(e) => setStoreForm({ ...storeForm, email: e.target.value })}
                placeholder="contato@loja.com"
              />
            </div>
            <div>
              <Label htmlFor="editPhone">Telefone</Label>
              <Input
                id="editPhone"
                value={storeForm.phone}
                onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <Label htmlFor="editWebsite">Website</Label>
              <Input
                id="editWebsite"
                value={storeForm.website}
                onChange={(e) => setStoreForm({ ...storeForm, website: e.target.value })}
                placeholder="https://loja.com"
              />
            </div>
            <div>
              <Label htmlFor="editLogo">Logo URL</Label>
              <Input
                id="editLogo"
                value={storeForm.logo}
                onChange={(e) => setStoreForm({ ...storeForm, logo: e.target.value })}
                placeholder="https://exemplo.com/logo.png"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="editAddress">Endereço</Label>
              <Input
                id="editAddress"
                value={storeForm.address}
                onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                placeholder="Endereço completo da loja"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingStore(null)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
