// convex/neighborhoods.ts
import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// INTERNAL QUERIES
// ===============================

export const get = internalQuery({
  args: { id: v.id("Neighborhood") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ===============================
// QUERIES
// ===============================

export const getAll = query({
  args: { isActive: (v.boolean()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Neighborhood");

    if (args.isActive !== undefined) {
      query = query.withIndex("by_isActive", (q) => q.eq("isActive", args.isActive));
    }

    return await query.collect();
  },
});

export const getById = query({
  args: { id: v.id("Neighborhood") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByCity = query({
  args: { 
    city: v.string(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let neighborhoods = await ctx.db.query("Neighborhood").collect();

    neighborhoods = neighborhoods.filter(n => n.city === args.city);

    if (args.isActive !== undefined) {
      neighborhoods = neighborhoods.filter(n => n.isActive === args.isActive);
    }

    return neighborhoods;
  },
});

// ===============================
// MUTATIONS
// ===============================

export const create = mutation({
  args: {
    name: v.string(),
    city: v.string(),
    province: v.string(),
    shippingCost: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("Neighborhood", {
      ...args,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("Neighborhood"),
    name: v.optional(v.string()),
    city: v.optional(v.string()),
    province: v.optional(v.string()),
    shippingCost: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});