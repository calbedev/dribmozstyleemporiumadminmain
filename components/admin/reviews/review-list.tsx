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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { usePermissions } from "@/components/admin/permission-guard"
import { Search, MoreHorizontal, Eye, Check, X, Edit, Trash2, Star, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useStore } from "@/contexts/store-context"
import type { Id } from "@/convex/_generated/dataModel"

export function ReviewList() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [ratingFilter, setRatingFilter] = useState<string>("all")
  const [selectedReviews, setSelectedReviews] = useState<string[]>([])
  const { can } = usePermissions()
  const { userRole } = useStore()
  if (!userRole) {
    return <div>Access denied</div>
  }
  const { toast } = useToast()
  const { selectedStore, isLoading } = useStore()

  const storeId = (selectedStore?._id as Id<"stores">) || ""

  const reviews = useQuery(api.adminreviews.list, {
    search: search || undefined,
    isApproved: statusFilter === "approved" ? true : statusFilter === "pending" ? false : undefined,
    rating: ratingFilter !== "all" ? Number.parseInt(ratingFilter) : undefined,
    limit: 50,
    storeId: storeId,
  })

  const reviewStats = useQuery(api.adminreviews.getStats, { storeId })
  const approveReview = useMutation(api.adminreviews.approve)
  const rejectReview = useMutation(api.adminreviews.reject)
  const deleteReview = useMutation(api.adminreviews.remove)
  const bulkApprove = useMutation(api.adminreviews.bulkApprove)

  const handleApprove = async (reviewId: string) => {
    try {
      await approveReview({ id: reviewId as any, storeId })
      toast({
        title: "Sucesso",
        description: "Review aprovado",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao aprovar review",
        variant: "destructive",
      })
    }
  }

  const handleReject = async (reviewId: string) => {
    try {
      await rejectReview({ id: reviewId as any, storeId })
      toast({
        title: "Sucesso",
        description: "Review rejeitado",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao rejeitar review",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Tem certeza que deseja excluir este review?")) return

    try {
      await deleteReview({ id: reviewId as any, storeId })
      toast({
        title: "Sucesso",
        description: "Review excluído com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir review",
        variant: "destructive",
      })
    }
  }

  const handleBulkApprove = async () => {
    if (selectedReviews.length === 0) return

    try {
      await bulkApprove({ ids: selectedReviews as any, storeId })
      toast({
        title: "Sucesso",
        description: `${selectedReviews.length} reviews aprovados`,
      })
      setSelectedReviews([])
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao aprovar reviews",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
    ))
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
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
      ) : selectedStore ? (
        <>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
            <p className="text-muted-foreground">
              Gerencie reviews da loja: <span className="font-medium">{selectedStore.name}</span>
            </p>
          </div>

          {reviewStats && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{reviewStats.total}</div>
                  <p className="text-xs text-muted-foreground">Total de Reviews</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{reviewStats.approved}</div>
                  <p className="text-xs text-muted-foreground">Aprovados</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">{reviewStats.pending}</div>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{reviewStats.verified}</div>
                  <p className="text-xs text-muted-foreground">Compra Verificada</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{reviewStats.averageRating.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Avaliação Média</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar reviews..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os status</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Avaliação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as avaliações</SelectItem>
                    <SelectItem value="5">5 estrelas</SelectItem>
                    <SelectItem value="4">4 estrelas</SelectItem>
                    <SelectItem value="3">3 estrelas</SelectItem>
                    <SelectItem value="2">2 estrelas</SelectItem>
                    <SelectItem value="1">1 estrela</SelectItem>
                  </SelectContent>
                </Select>
                {selectedReviews.length > 0 && can(userRole,"write", "reviews") && (
                  <Button onClick={handleBulkApprove} className="whitespace-nowrap">
                    Aprovar Selecionados ({selectedReviews.length})
                  </Button>
                )}
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
                    <TableHead>Cliente</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews?.reviews.map((review) => (
                    <TableRow key={review._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedReviews.includes(review._id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedReviews([...selectedReviews, review._id])
                            } else {
                              setSelectedReviews(selectedReviews.filter((id) => id !== review._id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={review.product?.thumbnail || "/placeholder.svg?height=40&width=40"}
                            alt={review.product?.name || "Produto"}
                            className="h-10 w-10 rounded object-cover"
                          />
                          <div>
                            <div className="font-medium">{review.product?.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{review.user?.name}</div>
                          <div className="text-sm text-muted-foreground">{review.user?.email}</div>
                          {review.isVerifiedPurchase && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Compra Verificada
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">{renderStars(review.rating)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {review.title && <div className="font-medium text-sm">{review.title}</div>}
                          <div className="text-sm text-muted-foreground line-clamp-2">{review.comment}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={review.isApproved ? "default" : "secondary"}>
                          {review.isApproved ? "Aprovado" : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(review.createdAt)}</TableCell>
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
                              <Link href={`/admin/reviews/${review._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>

                            {can(userRole,"write", "reviews") && (
                              <>
                                <DropdownMenuSeparator />
                                {!review.isApproved && (
                                  <DropdownMenuItem onClick={() => handleApprove(review._id)}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Aprovar
                                  </DropdownMenuItem>
                                )}
                                {review.isApproved && (
                                  <DropdownMenuItem onClick={() => handleReject(review._id)}>
                                    <X className="mr-2 h-4 w-4" />
                                    Rejeitar
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/reviews/${review._id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </Link>
                                </DropdownMenuItem>
                              </>
                            )}

                            {can(userRole,"delete", "reviews") && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(review._id)} className="text-destructive">
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

              {reviews?.reviews.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground mt-2">Nenhum review encontrado nesta loja</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Reviews</CardTitle>
            <CardDescription>Nenhuma loja selecionada</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Selecione uma loja no cabeçalho para visualizar os reviews.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
