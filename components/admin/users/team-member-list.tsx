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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { usePermissions } from "@/components/admin/permission-guard"
import { Search, MoreHorizontal, UserPlus, Edit, Trash2, Users, Mail } from "lucide-react"
import { toast } from "sonner"
import { useStore } from "@/contexts/store-context"
import type { Id } from "@/convex/_generated/dataModel"

export function TeamMemberList() {
  const [search, setSearch] = useState("")
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<any>(null)
  const { can } = usePermissions()
  const { selectedStore, isLoading } = useStore()

  const storeId = selectedStore?._id as Id<"stores">

  const members = useQuery(api.adminteam.listTeamMembers, {
    search: search || undefined,
    storeId: storeId, // Filtra membros apenas da loja selecionada
  })
  const stores = useQuery(api.adminstores.listStores, {})

  const inviteMember = useMutation(api.adminteam.inviteTeamMember)
  const updateMemberRole = useMutation(api.adminteam.updateTeamMemberRole)
  const removeMember = useMutation(api.adminteam.removeTeamMember)

  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    role: "viewer" as any,
    storeId: "",
  })

  const handleInvite = async () => {
    if (!inviteForm.email || !inviteForm.storeId) {
      toast.error("Email e loja são obrigatórios")
      return
    }

    try {
      await inviteMember({
        email: inviteForm.email,
        name: inviteForm.name,
        role: inviteForm.role,
        storeId: inviteForm.storeId as any,
      })
      toast.success("Convite enviado com sucesso!")
      setIsInviteOpen(false)
      setInviteForm({ email: "", name: "", role: "viewer", storeId: "" })
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      await updateMemberRole({ memberId: memberId as any, role: newRole as any })
      toast.success("Role atualizada com sucesso!")
      setEditingMember(null)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro?")) return

    try {
      await removeMember({ memberId: memberId as any })
      toast.success("Membro removido com sucesso!")
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800"
      case "moderator":
        return "bg-blue-100 text-blue-800"
      case "editor":
        return "bg-green-100 text-green-800"
      case "shipper":
        return "bg-orange-100 text-orange-800"
      case "viewer":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return "Proprietário"
      case "moderator":
        return "Moderador"
      case "editor":
        return "Editor"
      case "shipper":
        return "Expedidor"
      case "viewer":
        return "Visualizador"
      default:
        return role
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
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
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>Nenhuma loja selecionada</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Selecione uma loja no cabeçalho para visualizar os membros da equipe.</p>
        </CardContent>
      </Card>
    )
  }

  if (members === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>Carregando membros...</CardDescription>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membros da Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie membros da loja: <span className="font-medium">{selectedStore.name}</span>
          </p>
        </div>
        {can("create", "users") && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Membro</DialogTitle>
                <DialogDescription>Convide um novo membro para fazer parte da equipe de uma loja</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    placeholder="Nome do membro"
                  />
                </div>
                <div>
                  <Label htmlFor="store">Loja *</Label>
                  <Select
                    value={inviteForm.storeId}
                    onValueChange={(value) => setInviteForm({ ...inviteForm, storeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma loja" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores?.stores.map((store) => (
                        <SelectItem key={store._id} value={store._id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={inviteForm.role}
                    onValueChange={(value) => setInviteForm({ ...inviteForm, role: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                      <SelectItem value="shipper">Expedidor</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="moderator">Moderador</SelectItem>
                      <SelectItem value="owner">Proprietário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleInvite}>Enviar Convite</Button>
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
                placeholder="Buscar por email ou nome..."
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
                <TableHead>Membro</TableHead>
                <TableHead>Loja</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Convidado em</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.members.map((member) => (
                <TableRow key={member._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium">{member.name || "Nome não informado"}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{member.store?.name || "Loja não encontrada"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(member.role)}>{getRoleLabel(member.role)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.status === "active" ? "default" : "secondary"}>
                      {member.status === "active" ? "Ativo" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(member.invitedAt).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>
                    {can("update", "users") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setEditingMember(member)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRemove(member._id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {members.members.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground mt-2">Nenhum membro encontrado nesta loja</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Role do Membro</DialogTitle>
            <DialogDescription>Altere a role de {editingMember?.name || editingMember?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newRole">Nova Role</Label>
              <Select
                defaultValue={editingMember?.role}
                onValueChange={(value) => handleUpdateRole(editingMember?._id, value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Visualizador</SelectItem>
                  <SelectItem value="shipper">Expedidor</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="moderator">Moderador</SelectItem>
                  <SelectItem value="owner">Proprietário</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
