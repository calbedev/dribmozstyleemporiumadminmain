// /convex/products.ts
import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"

/**
 * Mutation para gerar uma URL de upload para o armazenamento do Convex.
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Mutation para criar um novo produto.
 */
export const createProduct = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    shortDesc: v.optional(v.string()),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    images: v.array(v.string()),
    thumbnail: v.string(),
    isNew: v.boolean(),
    isFeatured: v.boolean(),
    isPublished: v.boolean(),
    inStock: v.boolean(),
    stockCount: v.number(),
    minStock: v.number(),
    categoryId: v.id("Category"),
    brandId: v.optional(v.id("Brand")),
    metaTitle: v.optional(v.string()),
    metaDesc: v.optional(v.string()),
    variants: v.optional(
      v.array(
        v.object({
          colorId: v.optional(v.id("Color")),
          sizeId: v.optional(v.id("Size")),
          priceAdjust: v.number(),
          stockCount: v.number(),
          isActive: v.boolean(),
          sku: v.optional(v.string()),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Validação manual
    if (!args.name || !args.price || !args.categoryId) {
      throw new Error("Missing required fields: name, price, and categoryId.")
    }
    if (args.price <= 0) {
      throw new Error("Price must be a positive number.")
    }

    // Geração de slug simples e sem bibliotecas
    const slug = args.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    // Lógica para garantir a unicidade do slug pode ser adicionada aqui,
    // por exemplo, buscando por um slug existente e adicionando um sufixo numérico.

    // Obtenha a storeId do contexto de autenticação ou de outra fonte segura
    const storeId = "your_store_id_from_auth_or_context" as Id<"stores">

    const now = new Date().toISOString()
    const productData = {
      ...args,
      slug,
      storeId,
      avgRating: 0,
      reviewCount: 0,
      soldCount: 0,
      createdAt: now,
      updatedAt: now,
      publishedAt: args.isPublished ? now : undefined,
    }

    const productId = await ctx.db.insert("Product", productData)

    // Se houver variantes, salve-as
    if (args.variants) {
      for (const variant of args.variants) {
        const variantData = {
          ...variant,
          productId,
          sku: variant.sku || generateSku(productId, variant),
        }
        await ctx.db.insert("ProductVariant", variantData)
      }
    }

    return productId
  },
})

/**
 * Mutation para editar um produto existente.
 */
export const updateProduct = mutation({
  args: {
    _id: v.id("Product"),
    name: v.string(),
    // Inclua todos os campos que podem ser editados
    description: v.string(),
    shortDesc: v.optional(v.string()),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    images: v.array(v.string()),
    thumbnail: v.string(),
    isNew: v.boolean(),
    isFeatured: v.boolean(),
    isPublished: v.boolean(),
    inStock: v.boolean(),
    stockCount: v.number(),
    minStock: v.number(),
    categoryId: v.id("Category"),
    brandId: v.optional(v.id("Brand")),
    metaTitle: v.optional(v.string()),
    metaDesc: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validação manual
    if (!args.name || !args.price || !args.categoryId) {
      throw new Error("Missing required fields: name, price, and categoryId.")
    }

    const { _id, ...rest } = args
    const now = new Date().toISOString()
    const productData = {
      ...rest,
      updatedAt: now,
      // Lógica de `publishedAt` pode ser adicionada aqui
    }

    await ctx.db.patch(_id, productData)
  },
})

/**
 * Query para buscar um produto por ID.
 */
export const getProductById = query({
  args: { productId: v.id("Product") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId)
  },
})

/**
 * Função utilitária para gerar um SKU simples, sem bibliotecas.
 */
function generateSku(productId: any, variant: any) {
  const colorPart = variant.colorId ? variant.colorId.slice(0, 4) : "c"
  const sizePart = variant.sizeId ? variant.sizeId.slice(0, 4) : "s"
  return `${productId.slice(0, 4)}-${colorPart}-${sizePart}`
}