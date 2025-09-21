"use client"

import type React from "react"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function NeighborhoodList() {
  const [search, setSearch] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingNeighborhood, setEditingNeighborhood] = useState<any>(null)

  const neighborhoods = useQuery(api.adminlocations.getNeighborhoods, {
    search: search || undefined,
    city: selectedCity || undefined,
  })

  const cities = useQuery(api.adminlocations.getCities, {})
  const states = useQuery(api.adminlocations.getStates, {})

  const createNeighborhood = useMutation(api.adminlocations.createNeighborhood)
  const updateNeighborhood = useMutation(api.adminlocations.updateNeighborhood)
  const deleteNeighborhood = useMutation(api.adminlocations.deleteNeighborhood)

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    state: "",
    deliveryFee: 0,
    active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingNeighborhood) {
        await updateNeighborhood({
          id: editingNeighborhood._id,
          ...formData,
        })
        toast.success("Bairro atualizado com sucesso!")
      } else {
        await createNeighborhood(formData)
        toast.success("Bairro criado com sucesso!")
      }

      setIsDialogOpen(false)
      setEditingNeighborhood(null)
      setFormData({
        name: "",
        city: "",
        state: "",
        deliveryFee: 0,
        active: true,
      })
    } catch (error) {
      toast.error("Erro ao salvar bairro")
    }
  }

  const handleEdit = (neighborhood: any) => {
    setEditingNeighborhood(neighborhood)
    setFormData({
      name: neighborhood.name,
      city: neighborhood.city,
      state: neighborhood.state,
      deliveryFee: neighborhood.deliveryFee,
      active: neighborhood.active,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este bairro?")) {
      try {
        await deleteNeighborhood({ id: id as any })
        toast.success("Bairro excluído com sucesso!")
      } catch (error) {
        toast.error("Erro ao excluir bairro")
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bairros</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Bairro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNeighborhood ? "Editar Bairro" : "Novo Bairro"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="deliveryFee">Taxa de Entrega (MT)</Label>
                <Input
                  id="deliveryFee"
                  type="number"
                  step="0.01"
                  value={formData.deliveryFee}
                  onChange={(e) => setFormData({ ...formData, deliveryFee: Number.parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Ativo</Label>
              </div>
              <Button type="submit" className="w-full">
                {editingNeighborhood ? "Atualizar" : "Criar"} Bairro
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar bairros..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="">Todas as cidades</option>
          {cities?.map((city) => (
            <option key={city._id} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Taxa de Entrega</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {neighborhoods?.map((neighborhood) => (
              <TableRow key={neighborhood._id}>
                <TableCell className="font-medium">{neighborhood.name}</TableCell>
                <TableCell>{neighborhood.city}</TableCell>
                <TableCell>{neighborhood.state}</TableCell>
                <TableCell>MT {neighborhood.deliveryFee.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={neighborhood.active ? "default" : "secondary"}>
                    {neighborhood.active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(neighborhood)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(neighborhood._id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
