"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DollarSign, Package, ShoppingBag, Star, Tag, Store, Boxes, User, Calendar } from "lucide-react"

interface ProductDetailPageProps {
  
  id: Id<"Product">
}
// Componente para o esqueleto de carregamento
const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-10 w-1/3 bg-muted rounded"></div>
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-4">
        <div className="bg-muted rounded-lg aspect-square"></div>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-muted rounded aspect-square"></div>
          <div className="bg-muted rounded aspect-square"></div>
          <div className="bg-muted rounded aspect-square"></div>
        </div>
      </div>
      <div className="md:col-span-2 space-y-6">
        <div className="h-8 w-3/4 bg-muted rounded"></div>
        <div className="h-6 w-1/4 bg-muted rounded"></div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-5/6 bg-muted rounded"></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
            <div className="h-24 bg-muted rounded-lg"></div>
            <div className="h-24 bg-muted rounded-lg"></div>
            <div className="h-24 bg-muted rounded-lg"></div>
        </div>
      </div>
    </div>
     <div className="h-48 bg-muted rounded-lg"></div>
     <div className="h-48 bg-muted rounded-lg"></div>
  </div>
)

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "MZN" }).format(value)
}

const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value)
}

export function ProductDetail({ id }: ProductDetailPageProps) {

    const productDetails = useQuery(api.adminproducts.getProductDetails, {   productId: id })
  const productStats = useQuery(api.adminproducts.getProductStats, { productId: id })

  if (productDetails === undefined || productStats === undefined) {
    return <LoadingSkeleton />
  }

  if (productDetails === null) {
    return <p>Produto não encontrado.</p>
  }

  const { name, images, thumbnail, price, originalPrice, shortDesc, description, storeName, categoryName, brandName, inStock, stockCount, soldCount, avgRating, reviewCount, variants, reviews } = productDetails

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
        <p className="text-muted-foreground">Detalhes completos do produto e performance de vendas.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coluna de Imagens e Estatísticas */}
        <div className="lg:col-span-2 space-y-6">
            {/* Card de Informações Gerais */}
            <Card>
                <CardContent className="p-6 grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <img src={thumbnail} alt={name} className="rounded-lg w-full aspect-square object-cover" />
                        <div className="grid grid-cols-4 gap-4">
                            {images.slice(0, 4).map((img, idx) => (
                                <img key={idx} src={img} alt={`${name} - imagem ${idx + 1}`} className="rounded-md aspect-square object-cover" />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold">{formatCurrency(price)}</h2>
                            {originalPrice && (
                                <span className="text-lg text-muted-foreground line-through">{formatCurrency(originalPrice)}</span>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                             <Badge variant={inStock ? "default" : "destructive"}>
                                {inStock ? "Em Estoque" : "Fora de Estoque"}
                             </Badge>
                             <Badge variant="secondary">{stockCount} Unidades</Badge>
                             <Badge variant="secondary">{soldCount} Vendidos</Badge>
                        </div>
                        <p className="text-muted-foreground">{shortDesc}</p>
                        <div className="border-t pt-4 space-y-2 text-sm">
                            <div className="flex items-center gap-2"><Store className="h-4 w-4 text-muted-foreground" /> <strong>Loja:</strong> {storeName}</div>
                            <div className="flex items-center gap-2"><Boxes className="h-4 w-4 text-muted-foreground" /> <strong>Categoria:</strong> {categoryName}</div>
                            <div className="flex items-center gap-2"><Tag className="h-4 w-4 text-muted-foreground" /> <strong>Marca:</strong> {brandName || "N/A"}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card de Descrição */}
            <Card>
                <CardHeader><CardTitle>Descrição do Produto</CardTitle></CardHeader>
                <CardContent>
                    <div className="prose prose-sm max-w-none">
                        <p>{description}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        {/* Coluna de Estatísticas e Variantes */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Estatísticas de Vendas</CardTitle>
                    <CardDescription>Performance geral deste produto.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <DollarSign className="h-8 w-8 text-green-500"/>
                        <div>
                            <p className="text-sm text-muted-foreground">Receita Total</p>
                            <p className="text-2xl font-bold">{formatCurrency(productStats.totalRevenue)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Package className="h-8 w-8 text-blue-500"/>
                        <div>
                            <p className="text-sm text-muted-foreground">Unidades Vendidas</p>
                            <p className="text-2xl font-bold">{formatNumber(productStats.unitsSold)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <ShoppingBag className="h-8 w-8 text-purple-500"/>
                        <div>
                            <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                            <p className="text-2xl font-bold">{formatNumber(productStats.totalOrders)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {variants.length > 0 && (
                <Card>
                    <CardHeader><CardTitle>Variantes</CardTitle></CardHeader>
                    <CardContent>
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cor</TableHead>
                                    <TableHead>Tamanho</TableHead>
                                    <TableHead>Estoque</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {variants.map(variant => (
                                    <TableRow key={variant._id}>
                                        <TableCell>{variant.colorName || "-"}</TableCell>
                                        <TableCell>{variant.sizeName || "-"}</TableCell>
                                        <TableCell>{variant.stockCount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                         </Table>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>

       {/* Seção de Avaliações */}
        <Card>
            <CardHeader>
                <CardTitle>Avaliações Recentes</CardTitle>
                <CardDescription>
                    Média de {avgRating.toFixed(1)} <Star className="inline-block h-4 w-4 text-yellow-500 fill-yellow-500" /> de {reviewCount} avaliações.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {reviews.length > 0 ? reviews.map(review => (
                    <div key={review._id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{review.userName?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="font-semibold">{review.userName || "Anônimo"}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />
                                ))}
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {new Date(review.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                    </div>
                )) : (
                    <p className="text-center text-muted-foreground py-4">Este produto ainda não tem avaliações.</p>
                )}
            </CardContent>
        </Card>
    </div>
  )
}