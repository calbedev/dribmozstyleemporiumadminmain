import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: {
    search: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Brand")

    if (args.isActive !== undefined) {
      query = query.withIndex("by_isActive", (q) => q.eq("isActive", args.isActive))
    }

    let brands = await query.collect()

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      brands = brands.filter(
        (brand) =>
          brand.name.toLowerCase().includes(searchLower) ||
          brand.slug.toLowerCase().includes(searchLower) ||
          brand.description?.toLowerCase().includes(searchLower),
      )
    }

    // Get product count for each brand
    const brandsWithProductCount = await Promise.all(
      brands.map(async (brand) => {
        const products = await ctx.db
          .query("Product")
          .withIndex("by_brand", (q) => q.eq("brandId", brand._id))
          .collect()

        return {
          ...brand,
          productCount: products.length,
        }
      }),
    )

    // Apply pagination
    const offset = args.offset || 0
    const limit = args.limit || 20
    const paginatedBrands = brandsWithProductCount.slice(offset, offset + limit)

    return {
      brands: paginatedBrands,
      total: brandsWithProductCount.length,
      hasMore: offset + limit < brandsWithProductCount.length,
    }
  },
})

export const getById = query({
  args: { id: v.id("Brand") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    website: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if slug is unique
    const existingBrand = await ctx.db
      .query("Brand")
      .filter((q) => q.eq(q.field("slug"), args.slug))
      .first()

    if (existingBrand) {
      throw new Error("Slug já existe. Escolha um slug único.")
    }

    const brandId = await ctx.db.insert("Brand", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      logo: args.logo,
      website: args.website,
      isActive: args.isActive !== false,
    })

    return brandId
  },
})

export const update = mutation({
  args: {
    id: v.id("Brand"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    website: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args

    // Check if slug is unique (if being updated)
    if (updates.slug) {
      const existingBrand = await ctx.db
        .query("Brand")
        .filter((q) => q.eq(q.field("slug"), updates.slug))
        .first()

      if (existingBrand && existingBrand._id !== id) {
        throw new Error("Slug já existe. Escolha um slug único.")
      }
    }

    await ctx.db.patch(id, updates)
    return id
  },
})

export const remove = mutation({
  args: { id: v.id("Brand") },
  handler: async (ctx, args) => {
    // Check if brand has products
    const products = await ctx.db
      .query("Product")
      .withIndex("by_brand", (q) => q.eq("brandId", args.id))
      .collect()

    if (products.length > 0) {
      throw new Error("Não é possível excluir uma marca que possui produtos.")
    }

    await ctx.db.delete(args.id)
    return args.id
  },
})
