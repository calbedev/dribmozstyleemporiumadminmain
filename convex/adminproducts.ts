import { Doc, Id } from "./_generated/dataModel"
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: {
    search: v.optional(v.string()),
    categoryId: v.optional(v.id("Category")),
    brandId: v.optional(v.id("Brand")),
    isPublished: v.optional(v.boolean()),
    inStock: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    storeId: v.id("stores"), // Tornou obrigatório o storeId para filtrar por loja
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Product").withIndex("by_store", (q) => q.eq("storeId", args.storeId))

    if (args.categoryId) {
      query = query.filter((q) => q.eq(q.field("categoryId"), args.categoryId))
    }

    if (args.brandId) {
      query = query.filter((q) => q.eq(q.field("brandId"), args.brandId))
    }

    if (args.isPublished !== undefined) {
      query = query.filter((q) => q.eq(q.field("isPublished"), args.isPublished))
    }

    let products = await query.collect()

    // Apply additional filters
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      products = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.slug.toLowerCase().includes(searchLower),
      )
    }

    if (args.inStock !== undefined) {
      products = products.filter((product) => product.inStock === args.inStock)
    }

    // Get related data
    const productsWithRelations = await Promise.all(
      products.map(async (product) => {
        const category = product.categoryId ? await ctx.db.get(product.categoryId) : null
        const brand = product.brandId ? await ctx.db.get(product.brandId) : null
        const variants = await ctx.db
          .query("ProductVariant")
          .withIndex("by_product", (q) => q.eq("productId", product._id))
          .collect()

        return {
          ...product,
          category: category?.name || null,
          brand: brand?.name || null,
          variantCount: variants.length,
        }
      }),
    )

    // Apply pagination
    const offset = args.offset || 0
    const limit = args.limit || 20
    const paginatedProducts = productsWithRelations.slice(offset, offset + limit)

    return {
      products: paginatedProducts,
      total: productsWithRelations.length,
      hasMore: offset + limit < productsWithRelations.length,
    }
  },
})

export const getById = query({
  args: {
    id: v.id("Product"),
    storeId: v.id("stores"), // Adicionado storeId para validação de acesso
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id)
    if (!product) return null

    if (product.storeId !== args.storeId) {
      throw new Error("Produto não encontrado ou não pertence à loja selecionada")
    }

    const category = product.categoryId ? await ctx.db.get(product.categoryId) : null
    const brand = product.brandId ? await ctx.db.get(product.brandId) : null
    const variants = await ctx.db
      .query("ProductVariant")
      .withIndex("by_product", (q) => q.eq("productId", product._id))
      .collect()

    // Get variant details with colors and sizes
    const variantsWithDetails = await Promise.all(
      variants.map(async (variant) => {
        const color = variant.colorId ? await ctx.db.get(variant.colorId) : null
        const size = variant.sizeId ? await ctx.db.get(variant.sizeId) : null
        return {
          ...variant,
          color: color ? { id: color._id, name: color.name, hexCode: color.hexCode } : null,
          size: size ? { id: size._id, name: size.name } : null,
        }
      }),
    )

    return {
      ...product,
      category,
      brand,
      variants: variantsWithDetails,
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.optional(v.string()),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    images: v.array(v.string()),
    thumbnail: v.string(),
    categoryId: v.id("Category"),
    brandId: v.optional(v.id("Brand")),
    stockCount: v.number(),
    minStock: v.number(),
    metaTitle: v.optional(v.string()),
    metaDesc: v.optional(v.string()),
    isNew: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    isPublished: v.optional(v.boolean()),
    storeId: v.id("stores"), // Adicionado storeId obrigatório para associar produto à loja
  },
  handler: async (ctx, args) => {
    const existingProduct = await ctx.db
      .query("Product")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("slug"), args.slug))
      .first()

    if (existingProduct) {
      throw new Error("Slug já existe nesta loja. Escolha um slug único.")
    }

    const now = new Date().toISOString()

    const productId = await ctx.db.insert("Product", {
      storeId: args.storeId, // Associa produto à loja específica
      name: args.name,
      slug: args.slug,
      description: args.description,
      shortDesc: args.shortDesc,
      price: args.price,
      originalPrice: args.originalPrice,
      images: args.images,
      thumbnail: args.thumbnail,
      avgRating: 0,
      reviewCount: 0,
      isNew: args.isNew || false,
      isFeatured: args.isFeatured || false,
      isPublished: args.isPublished || false,
      inStock: args.stockCount > 0,
      stockCount: args.stockCount,
      soldCount: 0,
      minStock: args.minStock,
      categoryId: args.categoryId,
      brandId: args.brandId,
      metaTitle: args.metaTitle,
      metaDesc: args.metaDesc,
      createdAt: now,
      updatedAt: now,
      publishedAt: args.isPublished ? now : undefined,
    })

    return productId
  },
})

export const update = mutation({
  args: {
    id: v.id("Product"),
    storeId: v.id("stores"), // Adicionado storeId para validação
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDesc: v.optional(v.string()),
    price: v.optional(v.number()),
    originalPrice: v.optional(v.number()),
    images: v.optional(v.array(v.string())),
    thumbnail: v.optional(v.string()),
    categoryId: v.optional(v.id("Category")),
    brandId: v.optional(v.id("Brand")),
    stockCount: v.optional(v.number()),
    minStock: v.optional(v.number()),
    metaTitle: v.optional(v.string()),
    metaDesc: v.optional(v.string()),
    isNew: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, storeId, ...updates } = args

    const existingProduct = await ctx.db.get(id)
    if (!existingProduct || existingProduct.storeId !== storeId) {
      throw new Error("Produto não encontrado ou não pertence à loja selecionada")
    }

    // Check if slug is unique within the store (if being updated)
    if (updates.slug) {
      const duplicateProduct = await ctx.db
        .query("Product")
        .withIndex("by_store", (q) => q.eq("storeId", storeId))
        .filter((q) => q.and(q.eq(q.field("slug"), updates.slug), q.neq(q.field("_id"), id)))
        .first()

      if (duplicateProduct) {
        throw new Error("Slug já existe nesta loja. Escolha um slug único.")
      }
    }

    const now = new Date().toISOString()
    const updateData: any = {
      ...updates,
      updatedAt: now,
    }

    // Update stock status
    if (updates.stockCount !== undefined) {
      updateData.inStock = updates.stockCount > 0
    }

    // Set published date if publishing
    if (updates.isPublished === true) {
      const current = await ctx.db.get(id)
      if (current && !current.isPublished) {
        updateData.publishedAt = now
      }
    }

    await ctx.db.patch(id, updateData)
    return id
  },
})

export const remove = mutation({
  args: {
    id: v.id("Product"),
    storeId: v.id("stores"), // Adicionado storeId para validação
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id)
    if (!product || product.storeId !== args.storeId) {
      throw new Error("Produto não encontrado ou não pertence à loja selecionada")
    }

    // Remove associated variants first
    const variants = await ctx.db
      .query("ProductVariant")
      .withIndex("by_product", (q) => q.eq("productId", args.id))
      .collect()

    for (const variant of variants) {
      await ctx.db.delete(variant._id)
    }

    // Remove product tags
    const productTags = await ctx.db.query("ProductTag").collect()
    const tagsToRemove = productTags.filter((pt) => pt.productId === args.id)
    for (const tag of tagsToRemove) {
      await ctx.db.delete(tag._id)
    }

    await ctx.db.delete(args.id)
    return args.id
  },
})

export const togglePublished = mutation({
  args: {
    id: v.id("Product"),
    storeId: v.id("stores"), // Adicionado storeId para validação
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id)
    if (!product) throw new Error("Produto não encontrado")

    if (product.storeId !== args.storeId) {
      throw new Error("Produto não pertence à loja selecionada")
    }

    const now = new Date().toISOString()
    const isPublished = !product.isPublished

    await ctx.db.patch(args.id, {
      isPublished,
      publishedAt: isPublished ? now : undefined,
      updatedAt: now,
    })

    return { id: args.id, isPublished }
  },
})

export const bulkUpdate = mutation({
  args: {
    ids: v.array(v.id("Product")),
    storeId: v.id("stores"), // Adicionado storeId para validação
    updates: v.object({
      isPublished: v.optional(v.boolean()),
      isFeatured: v.optional(v.boolean()),
      isNew: v.optional(v.boolean()),
      categoryId: v.optional(v.id("Category")),
      brandId: v.optional(v.id("Brand")),
    }),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()

    for (const id of args.ids) {
      const product = await ctx.db.get(id)
      if (!product || product.storeId !== args.storeId) {
        continue // Pula produtos que não pertencem à loja
      }

      const updateData: any = {
        ...args.updates,
        updatedAt: now,
      }

      // Set published date if publishing
      if (args.updates.isPublished === true) {
        const current = await ctx.db.get(id)
        if (current && !current.isPublished) {
          updateData.publishedAt = now
        }
      }

      await ctx.db.patch(id, updateData)
    }

    return args.ids
  },
})

/**
 * Busca os detalhes completos de um produto, incluindo informações relacionadas
 * como nome da loja, categoria, marca, variantes e avaliações recentes.
 */
export const getProductDetails = query({
  args: {
    productId: v.id("Product"),
  },
  handler: async (ctx, args): Promise<(Doc<"Product"> & {
    storeName?: string
    categoryName?: string
    brandName?: string
    variants: (Doc<"ProductVariant"> & { colorName?: string; sizeName?: string })[]
    reviews: (Doc<"Review"> & { userName?: string })[]
  }) | null> => {
    // 1. Obter o documento principal do produto
    const product = await ctx.db.get(args.productId)
    if (!product) {
      return null
    }

    // 2. Obter dados relacionados em paralelo
    const storePromise = ctx.db.get(product.storeId)
    const categoryPromise = ctx.db.get(product.categoryId)
    const brandPromise = product.brandId ? ctx.db.get(product.brandId) : Promise.resolve(null)
    
    const variantsPromise = ctx.db
      .query("ProductVariant")
      .withIndex("by_product", (q) => q.eq("productId", product._id))
      .collect()

    const reviewsPromise = ctx.db
      .query("Review")
      .withIndex("by_product_isApproved", (q) => q.eq("productId", product._id).eq("isApproved", true))
      .order("desc")
      .take(5) // Pega as 5 avaliações mais recentes

    const [store, category, brand, variants, reviews] = await Promise.all([
      storePromise,
      categoryPromise,
      brandPromise,
      variantsPromise,
      reviewsPromise,
    ])

    // 3. Enriquecer as variantes com nomes de cor e tamanho
    const enrichedVariants = await Promise.all(
      variants.map(async (variant) => {
        const color = variant.colorId ? await ctx.db.get(variant.colorId) : null
        const size = variant.sizeId ? await ctx.db.get(variant.sizeId) : null
        return {
          ...variant,
          colorName: color?.name,
          sizeName: size?.name,
        }
      }),
    )

    // 4. Enriquecer as avaliações com o nome do usuário
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        const user = await ctx.db.get(review.userId)
        return {
          ...review,
          userName: user?.name,
        }
      }),
    )
    
    // 5. Retornar o objeto combinado
    return {
      ...product,
      storeName: store?.name,
      categoryName: category?.name,
      brandName: brand?.name,
      variants: enrichedVariants,
      reviews: enrichedReviews,
    }
  },
})

/**
 * Calcula e retorna as estatísticas de vendas para um produto específico.
 */
export const getProductStats = query({
  args: {
    productId: v.id("Product"),
  },
  handler: async (ctx, args): Promise<{
    totalRevenue: number
    unitsSold: number
    totalOrders: number
  }> => {
    // Busca todos os OrderItems relacionados a este produto
    const orderItems = await ctx.db
      .query("OrderItem")
      .filter((q) => q.eq(q.field("productId"), args.productId))
      .collect()
      
    if (orderItems.length === 0) {
      return { totalRevenue: 0, unitsSold: 0, totalOrders: 0 }
    }
    
    let totalRevenue = 0
    let unitsSold = 0
    const orderIds = new Set<Id<"StoreOrder">>()

    for (const item of orderItems) {
      totalRevenue += item.price * item.quantity
      unitsSold += item.quantity
      orderIds.add(item.orderIdForStore)
    }

    return {
      totalRevenue,
      unitsSold,
      totalOrders: orderIds.size,
    }
  },
})
