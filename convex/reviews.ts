import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// QUERIES
// ===============================

export const getByProduct = query({
  args: { 
    productId: v.id("Product"),
    isApproved: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("Review")
      .withIndex("by_product_isApproved", (q) => q.eq("productId", args.productId));

    if (args.isApproved !== undefined) {
      query = query.filter((q) => q.eq(q.field("isApproved"), args.isApproved));
    }

    let reviews = await query.collect();

    // Sort by creation date (newest first)
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (args.limit) {
      reviews = reviews.slice(0, args.limit);
    }

    return reviews;
  },
});

export const getByStore = query({
  args: { 
    storeId: v.id("stores"),
    isApproved: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("Review")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId));

    let reviews = await query.collect();

    if (args.isApproved !== undefined) {
      reviews = reviews.filter(review => review.isApproved === args.isApproved);
    }

    // Sort by creation date (newest first)
    reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (args.limit) {
      reviews = reviews.slice(0, args.limit);
    }

    return reviews;
  },
});

// ===============================
// MUTATIONS
// ===============================

export const create = mutation({
  args: {
    productId: v.id("Product"),
    userId: v.id("users_sync"),
    storeId: v.id("stores"),
    rating: v.number(),
    title: v.optional(v.string()),
    comment: v.string(),
    isVerifiedPurchase: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    const reviewId = await ctx.db.insert("Review", {
      ...args,
      isApproved: false, // Reviews need approval
      isHelpful: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Update product rating
    await updateProductRating(ctx, args.productId);

    return reviewId;
  },
});

export const approve = mutation({
  args: { reviewId: v.id("Review") },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error("Review not found");

    await ctx.db.patch(args.reviewId, {
      isApproved: true,
      updatedAt: new Date().toISOString(),
    });

    // Update product rating
    await updateProductRating(ctx, review.productId);

    return { success: true };
  },
});

// Helper function to update product rating
async function updateProductRating(ctx: any, productId: any) {
  const reviews = await ctx.db
    .query("Review")
    .withIndex("by_product_isApproved", (q) => 
      q.eq("productId", productId).eq("isApproved", true)
    )
    .collect();

  if (reviews.length === 0) return;

  const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  await ctx.db.patch(productId, {
    avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
    reviewCount: reviews.length,
    updatedAt: new Date().toISOString(),
  });
}