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
      .query("Wishlist")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const isInWishlist = query({
  args: {
    userId: v.string(),
    productId: v.id("Product"),
  },
  handler: async (ctx, args) => {
    const user= await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) return null;
    
    const item = await ctx.db
      .query("Wishlist")
      .withIndex("by_user_product", (q) => 
        q.eq("userId", user._id).eq("productId", args.productId)
      )
      .first();

    return !!item;
  },
});

// ===============================
// MUTATIONS
// ===============================

export const add = mutation({
  args: {
    userId: v.string(),
    productId: v.id("Product"),
  },
  handler: async (ctx, args) => {
    const user= await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) return null;
    // Check if already in wishlist
    const existing = await ctx.db
      .query("Wishlist")
      .withIndex("by_user_product", (q) => 
        q.eq("userId", user._id).eq("productId", args.productId)
      )
      .first();

    if (existing) {
      return { success: true, message: "Already in wishlist" };
    }

    await ctx.db.insert("Wishlist", {
      userId: user._id,
      productId: args.productId,
      createdAt: new Date().toISOString(),
    });

    return { success: true, message: "Added to wishlist" };
  },
});

export const remove = mutation({
  args: {
    userId: v.string(),
    productId: v.id("Product"),
  },
  handler: async (ctx, args) => {
    const user= await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) return null;

    const item = await ctx.db
      .query("Wishlist")
      .withIndex("by_user_product", (q) => 
        q.eq("userId", user._id).eq("productId", args.productId)
      )
      .first();

    if (item) {
      await ctx.db.delete(item._id);
    }

    return { success: true, message: "Removed from wishlist" };
  },
});

export const toggle = mutation({
  args: {
    userId: v.string(),
    productId: v.id("Product"),
  },
  handler: async (ctx, args) => {
    const user= await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) return null;

    const existing = await ctx.db
      .query("Wishlist")
      .withIndex("by_user_product", (q) => 
        q.eq("userId", user._id).eq("productId", args.productId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { success: true, action: "removed" };
    } else {
      await ctx.db.insert("Wishlist", {
        userId: user._id,
        productId: args.productId,
        createdAt: new Date().toISOString(),
      });
      return { success: true, action: "added" };
    }
  },
});