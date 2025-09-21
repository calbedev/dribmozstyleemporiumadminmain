import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// QUERIES
// ===============================

export const getAll = query({
  args: { isActive: (v.boolean()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Brand");

    if (args.isActive !== undefined) {
      query = query.withIndex("by_isActive", (q) => q.eq("isActive", args.isActive));
    }

    return await query.collect();
  },
});

export const getById = query({
  args: { id: v.id("Brand") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const brands = await ctx.db.query("Brand").collect();
    return brands.find(brand => brand.slug === args.slug) || null;
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
    logo: v.optional(v.string()),
    website: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("Brand", {
      ...args,
      isActive: true,
    });
  },
});

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
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});