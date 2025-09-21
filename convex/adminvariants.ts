import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const listByProduct = query({
  args: { productId: v.id("Product") },
  handler: async (ctx, args) => {
    const variants = await ctx.db
      .query("ProductVariant")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect()

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

    return variantsWithDetails
  },
})

export const create = mutation({
  args: {
    productId: v.id("Product"),
    colorId: v.optional(v.id("Color")),
    sizeId: v.optional(v.id("Size")),
    priceAdjust: v.number(),
    stockCount: v.number(),
    sku: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if SKU is unique (if provided)
    if (args.sku) {
      const existingVariant = await ctx.db
        .query("ProductVariant")
        .withIndex("by_sku", (q) => q.eq("sku", args.sku))
        .first()

      if (existingVariant) {
        throw new Error("SKU já existe. Escolha um SKU único.")
      }
    }

    const variantId = await ctx.db.insert("ProductVariant", {
      productId: args.productId,
      colorId: args.colorId,
      sizeId: args.sizeId,
      priceAdjust: args.priceAdjust,
      stockCount: args.stockCount,
      sku: args.sku,
      isActive: args.isActive !== false,
    })

    return variantId
  },
})

export const update = mutation({
  args: {
    id: v.id("ProductVariant"),
    colorId: v.optional(v.id("Color")),
    sizeId: v.optional(v.id("Size")),
    priceAdjust: v.optional(v.number()),
    stockCount: v.optional(v.number()),
    sku: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args

    // Check if SKU is unique (if being updated)
    if (updates.sku) {
      const existingVariant = await ctx.db
        .query("ProductVariant")
        .withIndex("by_sku", (q) => q.eq("sku", updates.sku))
        .first()

      if (existingVariant && existingVariant._id !== id) {
        throw new Error("SKU já existe. Escolha um SKU único.")
      }
    }

    await ctx.db.patch(id, updates)
    return id
  },
})

export const remove = mutation({
  args: { id: v.id("ProductVariant") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
    return args.id
  },
})
