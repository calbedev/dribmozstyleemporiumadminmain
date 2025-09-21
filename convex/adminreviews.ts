import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: {
    search: v.optional(v.string()),
    productId: v.optional(v.id("Product")),
    rating: v.optional(v.number()),
    isApproved: v.optional(v.boolean()),
    isVerifiedPurchase: v.optional(v.boolean()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    storeId: v.id("stores"), // Added storeId required to filter reviews by store
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Review").withIndex("by_store", (q) => q.eq("storeId", args.storeId))

    if (args.productId) {
      query = query.filter((q) => q.eq(q.field("productId"), args.productId))
    }

    if (args.isApproved !== undefined) {
      query = query.filter((q) => q.eq(q.field("isApproved"), args.isApproved))
    }

    let reviews = await query.order("desc").collect()

    // Apply filters
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      reviews = reviews.filter(
        (review) =>
          review.comment.toLowerCase().includes(searchLower) || review.title?.toLowerCase().includes(searchLower),
      )
    }

    if (args.rating) {
      reviews = reviews.filter((review) => review.rating === args.rating)
    }

    if (args.isVerifiedPurchase !== undefined) {
      reviews = reviews.filter((review) => review.isVerifiedPurchase === args.isVerifiedPurchase)
    }

    if (args.startDate) {
      reviews = reviews.filter((review) => review.createdAt >= args.startDate!)
    }

    if (args.endDate) {
      reviews = reviews.filter((review) => review.createdAt <= args.endDate!)
    }

    // Get related data
    const reviewsWithRelations = await Promise.all(
      reviews.map(async (review) => {
        const product = await ctx.db.get(review.productId)
        const user = await ctx.db.get(review.userId)

        return {
          ...review,
          product: product
            ? {
                name: product.name,
                thumbnail: product.thumbnail,
                slug: product.slug,
              }
            : null,
          user: user
            ? {
                name: user.name,
                email: user.email,
              }
            : null,
        }
      }),
    )

    // Apply pagination
    const offset = args.offset || 0
    const limit = args.limit || 20
    const paginatedReviews = reviewsWithRelations.slice(offset, offset + limit)

    return {
      reviews: paginatedReviews,
      total: reviewsWithRelations.length,
      hasMore: offset + limit < reviewsWithRelations.length,
    }
  },
})

export const getById = query({
  args: {
    id: v.id("Review"),
    storeId: v.id("stores"), // Added storeId for validation
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id)
    if (!review) return null

    // Verify if review belongs to the selected store
    if (review.storeId !== args.storeId) {
      throw new Error("Review não encontrado ou não pertence à loja selecionada")
    }

    const product = await ctx.db.get(review.productId)
    const user = await ctx.db.get(review.userId)

    return {
      ...review,
      product,
      user,
    }
  },
})

export const getStats = query({
  args: {
    storeId: v.id("stores"), // Added storeId for specific store statistics
  },
  handler: async (ctx, args) => {
    // Filter statistics only from the selected store
    const reviews = await ctx.db
      .query("Review")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .collect()

    const stats = {
      total: reviews.length,
      approved: reviews.filter((r) => r.isApproved).length,
      pending: reviews.filter((r) => !r.isApproved).length,
      verified: reviews.filter((r) => r.isVerifiedPurchase).length,
      byRating: {
        1: reviews.filter((r) => r.rating === 1).length,
        2: reviews.filter((r) => r.rating === 2).length,
        3: reviews.filter((r) => r.rating === 3).length,
        4: reviews.filter((r) => r.rating === 4).length,
        5: reviews.filter((r) => r.rating === 5).length,
      },
      averageRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
    }

    return stats
  },
})

export const approve = mutation({
  args: {
    id: v.id("Review"),
    storeId: v.id("stores"), // Added storeId for validation
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id)
    if (!review || review.storeId !== args.storeId) {
      throw new Error("Review não encontrado ou não pertence à loja selecionada")
    }

    const now = new Date().toISOString()
    await ctx.db.patch(args.id, {
      isApproved: true,
      updatedAt: now,
    })

    // Update product rating stats
    await updateProductRatingStats(ctx, review.productId)

    return args.id
  },
})

export const reject = mutation({
  args: {
    id: v.id("Review"),
    storeId: v.id("stores"), // Added storeId for validation
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id)
    if (!review || review.storeId !== args.storeId) {
      throw new Error("Review não encontrado ou não pertence à loja selecionada")
    }

    const now = new Date().toISOString()
    await ctx.db.patch(args.id, {
      isApproved: false,
      updatedAt: now,
    })

    // Update product rating stats
    await updateProductRatingStats(ctx, review.productId)

    return args.id
  },
})

export const update = mutation({
  args: {
    id: v.id("Review"),
    storeId: v.id("stores"), // Added storeId for validation
    title: v.optional(v.string()),
    comment: v.optional(v.string()),
    rating: v.optional(v.number()),
    isApproved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, storeId, ...updates } = args

    // Verify if review belongs to the store
    const review = await ctx.db.get(id)
    if (!review || review.storeId !== storeId) {
      throw new Error("Review não encontrado ou não pertence à loja selecionada")
    }

    const now = new Date().toISOString()

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: now,
    })

    // Update product rating stats if rating or approval changed
    if (review && (updates.rating !== undefined || updates.isApproved !== undefined)) {
      await updateProductRatingStats(ctx, review.productId)
    }

    return id
  },
})

export const remove = mutation({
  args: {
    id: v.id("Review"),
    storeId: v.id("stores"), // Added storeId for validation
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.id)
    if (!review || review.storeId !== args.storeId) {
      throw new Error("Review não encontrado ou não pertence à loja selecionada")
    }

    await ctx.db.delete(args.id)
    await updateProductRatingStats(ctx, review.productId)
    return args.id
  },
})

export const bulkApprove = mutation({
  args: {
    ids: v.array(v.id("Review")),
    storeId: v.id("stores"), // Added storeId for validation
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const productIds = new Set<string>()

    for (const id of args.ids) {
      const review = await ctx.db.get(id)
      // Approve reviews that belong to the store
      if (review && review.storeId === args.storeId) {
        await ctx.db.patch(id, {
          isApproved: true,
          updatedAt: now,
        })
        productIds.add(review.productId)
      }
    }

    // Update product rating stats for affected products
    for (const productId of productIds) {
      await updateProductRatingStats(ctx, productId as any)
    }

    return args.ids
  },
})

// Helper function to update product rating statistics
async function updateProductRatingStats(ctx: any, productId: string) {
  const productReviews = await ctx.db
    .query("Review")
    .withIndex("by_product_isApproved", (q) => q.eq("productId", productId).eq("isApproved", true))
    .collect()

  const reviewCount = productReviews.length
  const avgRating =
    reviewCount > 0 ? productReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount : 0

  await ctx.db.patch(productId, {
    reviewCount,
    avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
    updatedAt: new Date().toISOString(),
  })
}
