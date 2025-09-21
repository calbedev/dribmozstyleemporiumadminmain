import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// QUERIES
// ===============================

export const getAll = query({
  args: {
    isActive: v.optional(v.boolean()),
    parentId: v.optional(v.id("Category")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Category");

    if (args.parentId !== undefined) {
      query = query.withIndex("by_parent", (q) => q.eq("parentId", args.parentId));
    }

    let categories = await query.collect();

    if (args.isActive !== undefined) {
      categories = categories.filter(cat => cat.isActive === args.isActive);
    }

    return categories.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getById = query({
  args: { id: v.id("Category") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const categories = await ctx.db.query("Category").collect();
    return categories.find(cat => cat.slug === args.slug) || null;
  },
});

export const getMainCategories = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("Category")
      .withIndex("by_parent", (q) => q.eq("parentId", undefined))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const getSubCategories = query({
  args: { parentId: v.id("Category") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("Category")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// ===============================
// MUTATIONS
// ===============================

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    parentId: v.optional(v.id("Category")),
    metaTitle: v.optional(v.string()),
    metaDesc: v.optional(v.string()),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("Category", {
      ...args,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("Category"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    metaDesc: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});