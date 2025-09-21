import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const list = query({
  args: {
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let banners = await ctx.db.query("banners").collect()

    if (args.search) {
      const searchTerm = args.search.toLowerCase()
      banners = banners.filter(
        (banner) =>
          banner.title.toLowerCase().includes(searchTerm) || banner.description?.toLowerCase().includes(searchTerm),
      )
    }

    return {
      banners: banners.sort((a, b) => b.sortOrder - a.sortOrder),
      total: banners.length,
    }
  },
})

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    linkUrl: v.optional(v.string()),
    position: v.union(v.literal("hero"), v.literal("sidebar"), v.literal("footer")),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("banners", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const update = mutation({
  args: {
    id: v.id("banners"),
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    linkUrl: v.optional(v.string()),
    position: v.union(v.literal("hero"), v.literal("sidebar"), v.literal("footer")),
    sortOrder: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const toggle = mutation({
  args: {
    id: v.id("banners"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: {
    id: v.id("banners"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id)
  },
})
