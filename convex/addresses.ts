import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// QUERIES
// ===============================

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user= await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) return null;
    return await ctx.db
      .query("Address")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const getDefault = query({
  args: { userId: v.id("users_sync") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("Address")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isDefault"), true))
      .first();
  },
});

export const getById = query({
  args: { id: v.id("Address") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ===============================
// MUTATIONS
// ===============================

export const create = mutation({
  args: {
    userId: v.string(),
    block: v.number(),
    houseNumber: v.number(),
    neighborhood: v.id("Neighborhood"),
    buildingNumber: v.optional(v.number()),
    street: v.optional(v.string()),
    reference: v.optional(v.string()),
    city: v.string(),
    province: v.string(),
    zipCode: v.string(),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const user= await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (!user) return null;

    // If this is set as default, remove default from other addresses
    if (args.isDefault) {
      const existingAddresses = await ctx.db
        .query("Address")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect();

      for (const address of existingAddresses) {
        if (address.isDefault) {
          await ctx.db.patch(address._id, { isDefault: false });
        }
      }
    }
    console.log("Creating address for user:", user._id);
    return await ctx.db.insert("Address", {
      ...args,
      userId: user._id,
      isDefault: args.isDefault || false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("Address"),
    block: v.optional(v.number()),
    houseNumber: v.optional(v.number()),
    neighborhood: v.optional(v.id("Neighborhood")),
    buildingNumber: v.optional(v.number()),
    street: v.optional(v.string()),
    reference: v.optional(v.string()),
    city: v.optional(v.string()),
    province: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // If this is set as default, remove default from other addresses
    if (updates.isDefault) {
      const address = await ctx.db.get(id);
      if (address) {
        const existingAddresses = await ctx.db
          .query("Address")
          .withIndex("by_user", (q) => q.eq("userId", address.userId))
          .collect();

        for (const addr of existingAddresses) {
          if (addr._id !== id && addr.isDefault) {
            await ctx.db.patch(addr._id, { isDefault: false });
          }
        }
      }
    }

    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("Address") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id);
  },
});