import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// QUERIES
// ===============================

export const getActive = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("Slide")
      .withIndex("by_store_active", (q) => 
        q.eq("storeId", args.storeId).eq("isActive", true)
      )
      .collect()
      .then(slides => slides.sort((a, b) => a.sortOrder - b.sortOrder));
  },
});

export const getAll = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("Slide")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .collect()
      .then(slides => slides.sort((a, b) => a.sortOrder - b.sortOrder));
  },
});

export const getById = query({
  args: { id: v.id("Slide") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ===============================
// MUTATIONS
// ===============================

export const create = mutation({
  args: {
    storeId: v.id("stores"),
    title: v.string(),
    subtitle: v.string(),
    description: v.string(),
    image: v.string(),
    cta: v.string(),
    href: v.string(),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("Slide", {
      ...args,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("Slide"),
    title: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    cta: v.optional(v.string()),
    href: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("Slide") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});