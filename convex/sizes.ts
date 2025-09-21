import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// QUERIES
// ===============================

export const getAll = query({
  args: { 
    isActive: v.optional(v.boolean()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Size");

    if (args.isActive !== undefined) {
      query = query.withIndex("by_isActive", (q) => q.eq("isActive", args.isActive));
    }

    let sizes = await query.collect();

    if (args.category) {
      sizes = sizes.filter(size => size.category === args.category);
    }

    return sizes.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const getById = query({
  args: { id: v.id("Size") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("Size")
      .withIndex("by_category_sortOrder", (q) => q.eq("category", args.category))
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
    category: v.string(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("Size", {
      ...args,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("Size"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});