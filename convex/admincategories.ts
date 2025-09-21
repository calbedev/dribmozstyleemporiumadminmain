import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: {
    search: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    parentId: v.optional(v.id("Category")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Category")

    if (args.parentId !== undefined) {
      query = query.withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
    } else {
      query = query.withIndex("by_isActive_sortOrder", (q) => q.eq("isActive", args.isActive ?? true))
    }

    let categories = await query.order("asc").collect()

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      categories = categories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchLower) ||
          category.slug.toLowerCase().includes(searchLower) ||
          category.description?.toLowerCase().includes(searchLower),
      )
    }

    // Get parent information for each category
    const categoriesWithParent = await Promise.all(
      categories.map(async (category) => {
        const parent = category.parentId ? await ctx.db.get(category.parentId) : null
        const childCount = await ctx.db
          .query("Category")
          .withIndex("by_parent", (q) => q.eq("parentId", category._id))
          .collect()

        return {
          ...category,
          parent: parent ? { id: parent._id, name: parent.name } : null,
          childCount: childCount.length,
        }
      }),
    )

    return { categories: categoriesWithParent }
  },
})

export const getTree = query({
  handler: async (ctx) => {
    const allCategories = await ctx.db
      .query("Category")
      .withIndex("by_isActive_sortOrder", (q) => q.eq("isActive", true))
      .order("asc")
      .collect()

    // Build tree structure
    const categoryMap = new Map()
    const rootCategories: any[] = []

    // First pass: create map of all categories
    allCategories.forEach((category) => {
      categoryMap.set(category._id, { ...category, children: [] })
    })

    // Second pass: build tree
    allCategories.forEach((category) => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          parent.children.push(categoryMap.get(category._id))
        }
      } else {
        rootCategories.push(categoryMap.get(category._id))
      }
    })

    return rootCategories
  },
})

export const getById = query({
  args: { id: v.id("Category") },
  handler: async (ctx, args) => {
    const category = await ctx.db.get(args.id)
    if (!category) return null

    const parent = category.parentId ? await ctx.db.get(category.parentId) : null
    const children = await ctx.db
      .query("Category")
      .withIndex("by_parent", (q) => q.eq("parentId", category._id))
      .collect()

    return {
      ...category,
      parent,
      children,
    }
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    parentId: v.optional(v.id("Category")),
    metaTitle: v.optional(v.string()),
    metaDesc: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if slug is unique
    const existingCategory = await ctx.db
      .query("Category")
      .filter((q) => q.eq(q.field("slug"), args.slug))
      .first()

    if (existingCategory) {
      throw new Error("Slug já existe. Escolha um slug único.")
    }

    // Get next sort order if not provided
    let sortOrder = args.sortOrder
    if (sortOrder === undefined) {
      const siblings = await ctx.db
        .query("Category")
        .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
        .collect()
      sortOrder = siblings.length
    }

    const categoryId = await ctx.db.insert("Category", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      image: args.image,
      parentId: args.parentId,
      metaTitle: args.metaTitle,
      metaDesc: args.metaDesc,
      isActive: args.isActive !== false,
      sortOrder,
    })

    return categoryId
  },
})

export const update = mutation({
  args: {
    id: v.id("Category"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    parentId: v.optional(v.id("Category")),
    metaTitle: v.optional(v.string()),
    metaDesc: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args

    // Check if slug is unique (if being updated)
    if (updates.slug) {
      const existingCategory = await ctx.db
        .query("Category")
        .filter((q) => q.eq(q.field("slug"), updates.slug))
        .first()

      if (existingCategory && existingCategory._id !== id) {
        throw new Error("Slug já existe. Escolha um slug único.")
      }
    }

    // Prevent setting parent to self or descendant
    if (updates.parentId) {
      const category = await ctx.db.get(id)
      if (category && updates.parentId === id) {
        throw new Error("Uma categoria não pode ser pai de si mesma.")
      }
      // TODO: Add check for circular references
    }

    await ctx.db.patch(id, updates)
    return id
  },
})

export const remove = mutation({
  args: { id: v.id("Category") },
  handler: async (ctx, args) => {
    // Check if category has children
    const children = await ctx.db
      .query("Category")
      .withIndex("by_parent", (q) => q.eq("parentId", args.id))
      .collect()

    if (children.length > 0) {
      throw new Error("Não é possível excluir uma categoria que possui subcategorias.")
    }

    // Check if category has products
    const products = await ctx.db
      .query("Product")
      .withIndex("by_category", (q) => q.eq("categoryId", args.id))
      .collect()

    if (products.length > 0) {
      throw new Error("Não é possível excluir uma categoria que possui produtos.")
    }

    await ctx.db.delete(args.id)
    return args.id
  },
})

export const reorder = mutation({
  args: {
    categories: v.array(
      v.object({
        id: v.id("Category"),
        sortOrder: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const category of args.categories) {
      await ctx.db.patch(category.id, { sortOrder: category.sortOrder })
    }
    return true
  },
})
