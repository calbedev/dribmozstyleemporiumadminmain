// convex/cart.ts
import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ===============================
// QUERIES
// ===============================

export const getByUser = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.userId) return null;
    const user= await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) return null;

    const cart = await ctx.db
      .query("Cart")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isPurshed"), false))
      .first();

    if (!cart) return null;

    const cartItems = await ctx.db
      .query("CartItem")
      .withIndex("by_cart", (q) => q.eq("cartId", cart._id))
      .collect();

    return { cart, items: cartItems };
  },
});

export const getBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query("Cart")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("isPurshed"), false))
      .first();

    if (!cart) return null;

    const cartItems = await ctx.db
      .query("CartItem")
      .withIndex("by_cart", (q) => q.eq("cartId", cart._id))
      .collect();

    return { cart, items: cartItems };
  },
});

// ===============================
// MUTATIONS
// ===============================

export const addItem = mutation({
  args: {
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    productId: v.id("Product"),
    variantId: v.optional(v.id("ProductVariant")),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    if (!args.userId && !args.sessionId) {
      throw new Error("Either userId or sessionId must be provided");
    }
    const now = new Date().toISOString();
    let user;
    if (args.userId) {
      user = await ctx.db
        .query("users_sync")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();
    }


    // Get or create cart
    let cart;
    if (args.userId && user) {
      cart = await ctx.db
        .query("Cart")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("isPurshed"), false))
        .first();
    } else if (args.sessionId) {
      cart = await ctx.db
        .query("Cart")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .filter((q) => q.eq(q.field("isPurshed"), false))
        .first();
    }

    if (!cart) {
      const cartId = await ctx.db.insert("Cart", {
        userId: user?._id,
        sessionId: args.sessionId,
        createdAt: now,
        updatedAt: now,
        isPurshed: false,
      });
      cart = await ctx.db.get(cartId);
    }

    if (!cart) throw new Error("Failed to create cart");

    // Get product price
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    // Check if item already exists in cart
    const existingItem = await ctx.db
      .query("CartItem")
      .withIndex("by_cart", (q) => q.eq("cartId", cart._id))
      .filter((q) => 
        q.and(
          q.eq(q.field("productId"), args.productId),
          args.variantId ? q.eq(q.field("variantId"), args.variantId) : q.eq(q.field("variantId"), undefined)
        )
      )
      .first();

    if (existingItem) {
      // Update quantity
      await ctx.db.patch(existingItem._id, {
        quantity: existingItem.quantity + args.quantity,
        updatedAt: now,
      });
    } else {
      // Create new cart item
      await ctx.db.insert("CartItem", {
        cartId: cart._id,
        productId: args.productId,
        variantId: args.variantId,
        quantity: args.quantity,
        price: product.price,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Update cart timestamp
    await ctx.db.patch(cart._id, { updatedAt: now });

    return { success: true };
  },
});

export const updateQuantity = mutation({
  args: {
    itemId: v.id("CartItem"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.quantity <= 0) {
      await ctx.db.delete(args.itemId);
    } else {
      await ctx.db.patch(args.itemId, {
        quantity: args.quantity,
        updatedAt: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});

export const removeItem = mutation({
  args: { itemId: v.id("CartItem") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.itemId);
    return { success: true };
  },
});

export const clearCart = mutation({
  args: {
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userId && !args.sessionId) {
      throw new Error("Either userId or sessionId must be provided");
    }
    let cart;
    if (args.userId) {
      const user= await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

      if (!user) return { success: false };

      cart = await ctx.db
        .query("Cart")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .filter((q) => q.eq(q.field("isPurshed"), false))
        .first();
    } else if (args.sessionId) {
      cart = await ctx.db
        .query("Cart")
        .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
        .filter((q) => q.eq(q.field("isPurshed"), false))
        .first();
    }

    if (!cart) return { success: true };

    const cartItems = await ctx.db
      .query("CartItem")
      .withIndex("by_cart", (q) => q.eq("cartId", cart._id))
      .collect();

    for (const item of cartItems) {
      await ctx.db.delete(item._id);
    }

    return { success: true };
  },
});

export const getCartItems = internalQuery({
    args: { cartId: v.id("Cart") },
    handler: async (ctx, args) => {
        if (!args.cartId) return null;
        return await ctx.db
            .query("CartItem")
            .withIndex("by_cart", (q) => q.eq("cartId", args.cartId))
            .collect();
    },
});