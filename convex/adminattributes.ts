import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

// COLORS
export const listColors = query({
  args: {
    search: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Color")

    if (args.isActive !== undefined) {
      query = query.withIndex("by_isActive", (q) => q.eq("isActive", args.isActive))
    }

    let colors = await query.collect()

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      colors = colors.filter((color) => color.name.toLowerCase().includes(searchLower))
    }

    return { colors }
  },
})

export const createColor = mutation({
  args: {
    name: v.string(),
    hexCode: v.string(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const colorId = await ctx.db.insert("Color", {
      name: args.name,
      hexCode: args.hexCode,
      isActive: args.isActive !== false,
    })

    return colorId
  },
})

export const updateColor = mutation({
  args: {
    id: v.id("Color"),
    name: v.optional(v.string()),
    hexCode: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    await ctx.db.patch(id, updates)
    return id
  },
})

export const removeColor = mutation({
  args: { id: v.id("Color") },
  handler: async (ctx, args) => {
    // Check if color is used in variants
    const variants = await ctx.db.query("ProductVariant").collect()
    const usedInVariants = variants.some((variant) => variant.colorId === args.id)

    if (usedInVariants) {
      throw new Error("Não é possível excluir uma cor que está sendo usada em variações de produtos.")
    }

    await ctx.db.delete(args.id)
    return args.id
  },
})

// SIZES
export const listSizes = query({
  args: {
    search: v.optional(v.string()),
    category: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Size")

    if (args.category) {
      query = query.withIndex("by_category_sortOrder", (q) => q.eq("category", args.category))
    } else if (args.isActive !== undefined) {
      query = query.withIndex("by_isActive", (q) => q.eq("isActive", args.isActive))
    }

    let sizes = await query.collect()

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      sizes = sizes.filter((size) => size.name.toLowerCase().includes(searchLower))
    }

    return { sizes }
  },
})

export const createSize = mutation({
  args: {
    name: v.string(),
    category: v.string(),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get next sort order if not provided
    let sortOrder = args.sortOrder
    if (sortOrder === undefined) {
      const siblings = await ctx.db
        .query("Size")
        .withIndex("by_category_sortOrder", (q) => q.eq("category", args.category))
        .collect()
      sortOrder = siblings.length
    }

    const sizeId = await ctx.db.insert("Size", {
      name: args.name,
      category: args.category,
      sortOrder,
      isActive: args.isActive !== false,
    })

    return sizeId
  },
})

export const updateSize = mutation({
  args: {
    id: v.id("Size"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    await ctx.db.patch(id, updates)
    return id
  },
})

export const removeSize = mutation({
  args: { id: v.id("Size") },
  handler: async (ctx, args) => {
    // Check if size is used in variants
    const variants = await ctx.db.query("ProductVariant").collect()
    const usedInVariants = variants.some((variant) => variant.sizeId === args.id)

    if (usedInVariants) {
      throw new Error("Não é possível excluir um tamanho que está sendo usado em variações de produtos.")
    }

    await ctx.db.delete(args.id)
    return args.id
  },
})

export const getSizes = listSizes
export const deleteSize = removeSize

// TAGS
export const listTags = query({
  args: {
    search: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Tag")

    if (args.isActive !== undefined) {
      query = query.withIndex("by_isActive", (q) => q.eq("isActive", args.isActive))
    }

    let tags = await query.collect()

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      tags = tags.filter(
        (tag) => tag.name.toLowerCase().includes(searchLower) || tag.slug.toLowerCase().includes(searchLower),
      )
    }

    // Get usage count for each tag
    const tagsWithUsage = await Promise.all(
      tags.map(async (tag) => {
        const productTags = await ctx.db.query("ProductTag").collect()
        const usageCount = productTags.filter((pt) => pt.tagId === tag._id).length

        return {
          ...tag,
          usageCount,
        }
      }),
    )

    return { tags: tagsWithUsage }
  },
})

export const createTag = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    color: v.string(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Check if slug is unique
    const existingTag = await ctx.db
      .query("Tag")
      .filter((q) => q.eq(q.field("slug"), args.slug))
      .first()

    if (existingTag) {
      throw new Error("Slug já existe. Escolha um slug único.")
    }

    const tagId = await ctx.db.insert("Tag", {
      name: args.name,
      slug: args.slug,
      color: args.color,
      isActive: args.isActive !== false,
    })

    return tagId
  },
})

export const updateTag = mutation({
  args: {
    id: v.id("Tag"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args

    // Check if slug is unique (if being updated)
    if (updates.slug) {
      const existingTag = await ctx.db
        .query("Tag")
        .filter((q) => q.eq(q.field("slug"), updates.slug))
        .first()

      if (existingTag && existingTag._id !== id) {
        throw new Error("Slug já existe. Escolha um slug único.")
      }
    }

    await ctx.db.patch(id, updates)
    return id
  },
})

export const removeTag = mutation({
  args: { id: v.id("Tag") },
  handler: async (ctx, args) => {
    // Remove all product-tag associations
    const productTags = await ctx.db.query("ProductTag").collect()
    const associationsToRemove = productTags.filter((pt) => pt.tagId === args.id)

    for (const association of associationsToRemove) {
      await ctx.db.delete(association._id)
    }

    await ctx.db.delete(args.id)
    return args.id
  },
})

export const getTags = listTags
export const deleteTags = removeTag

export const getColors = listColors
export const deleteColor = removeColor
export const createColors = createColor
export const updateColors = updateColor