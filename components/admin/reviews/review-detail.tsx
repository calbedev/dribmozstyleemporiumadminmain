"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Star, User, Package, Calendar, MessageSquare } from "lucide-react"
import Link from "next/link"

interface ReviewDetailProps {
  reviewId: string
}

export function ReviewDetail({ reviewId }: ReviewDetailProps) {
  const router = useRouter()
  const { toast } = useToast()

  const review = useQuery(api.adminreviews.getById, { id: reviewId as any })
  const updateReview = useMutation(api.adminreviews.update)
  const moderateReview = useMutation(api.adminreviews.moderate)

  const [adminResponse, setAdminResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const handleModerate = async (status: "approved" | "rejected") => {
    setLoading(true)
    try {
      await moderateReview({
        id: reviewId as any,
        status,
        adminResponse: adminResponse || undefined,
      })
      toast({
        title: "Sucesso",
        description: `Review ${status === "approved" ? "aprovada" : "rejeitada"} com sucesso`,
      })
      router.push("/admin/reviews")
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao moderar review",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!review) {
    return <div>Carregando...</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default"
      case "rejected":
        return "destructive"
      default:
        return "secondary"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Aprovada"
      case "rejected":
        return "Rejeitada"
      default:
        return "Pendente"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/reviews">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalhes da Review</h1>
            <p className="text-muted-foreground">Gerencie e modere avaliações de produtos</p>
          </div>
        </div>
        <Badge variant={getStatusColor(review.status)}>{getStatusText(review.status)}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Avaliação do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= review.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <span className="font-semibold">{review.rating}/5</span>
              </div>

              {review.title && (
                <div>
                  <h3 className="font-semibold text-lg">{review.title}</h3>
                </div>
              )}

              <div className="prose max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">{review.comment}</p>
              </div>

              {review.images && review.images.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Imagens anexadas:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {review.images.map((image, index) => (
                      <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Review image ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {review.status === "pending" && (
            <Card>
              <CardHeader>
                <CardTitle>Resposta do Administrador</CardTitle>
                <CardDescription>Adicione uma resposta opcional antes de moderar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminResponse">Resposta (opcional)</Label>
                  <Textarea
                    id="adminResponse"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Digite uma resposta para o cliente..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleModerate("approved")} disabled={loading} className="flex-1">
                    Aprovar Review
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleModerate("rejected")}
                    disabled={loading}
                    className="flex-1"
                  >
                    Rejeitar Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {review.adminResponse && (
            <Card>
              <CardHeader>
                <CardTitle>Resposta do Administrador</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{review.adminResponse}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{review.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{review.customerEmail}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data da avaliação</p>
                <p className="font-medium">{new Date(review._creationTime).toLocaleDateString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produto Avaliado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Nome do produto</p>
                <p className="font-medium">{review.productName}</p>
              </div>
              {review.variantInfo && (
                <div>
                  <p className="text-sm text-muted-foreground">Variante</p>
                  <p className="font-medium">{review.variantInfo}</p>
                </div>
              )}
              <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                <Link href={`/admin/products/${review.productId}/edit`}>Ver Produto</Link>
              </Button>
            </CardContent>
          </Card>

          {review.orderId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Pedido Relacionado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild className="w-full bg-transparent">
                  <Link href={`/admin/orders/${review.orderId}`}>Ver Pedido #{review.orderId.slice(-8)}</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
