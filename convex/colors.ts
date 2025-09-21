import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// QUERIES
// ===============================

export const getAll = query({
  args: { isActive: (v.boolean()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Color");

    if (args.isActive !== undefined) {
      query = query.withIndex("by_isActive", (q) => q.eq("isActive", args.isActive));
    }

    return await query.collect();
  },
});

export const getById = query({
  args: { id: v.id("Color") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ===============================
// MUTATIONS
// ===============================

export const create = mutation({
  args: {
    name: v.string(),
    hexCode: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("Color", {
      ...args,
      isActive: true,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("Color"),
    name: v.optional(v.string()),
    hexCode: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    return await ctx.db.patch(id, updates);
  },
});