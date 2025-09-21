import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// QUERIES
// ===============================

export const getByStore = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const settings = await ctx.db
      .query("settings")
      .filter((q) => q.eq(q.field("storeId"), args.storeId))
      .first();

    // Return default settings if none exist
    if (!settings) {
      return {
        storeId: args.storeId,
        storeName: "DribMoz",
        storeDescription: "Sua loja de moda online",
        contactEmail: "contato@dribmoz.co.mz",
        contactPhone: "+258 84 123 4567",
        address: "Maputo, Moçambique",
        freeShippingThreshold: 299,
        defaultShippingFee: 50,
        taxRate: 0.17,
        currency: "MT",
        paymentMethods: ["MPESA", "EMOLA", "MKESH", "CREDIT_CARD"],
      };
    }

    return settings;
  },
});

// ===============================
// MUTATIONS
// ===============================

export const createOrUpdate = mutation({
  args: {
    storeId: v.id("stores"),
    storeName: v.optional(v.string()),
    storeDescription: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    freeShippingThreshold: v.optional(v.number()),
    defaultShippingFee: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    currency: v.optional(v.string()),
    businessHours: v.optional(v.any()),
    socialMedia: v.optional(v.any()),
    seoSettings: v.optional(v.any()),
    paymentMethods: v.optional(v.array(v.string())),
    emailSettings: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const existing = await ctx.db
      .query("settings")
      .filter((q) => q.eq(q.field("storeId"), args.storeId))
      .first();

    if (existing) {
      const { storeId, ...updates } = args;
      return await ctx.db.patch(existing._id, {
        ...updates,
        updatedAt: now,
      });
    } else {
      return await ctx.db.insert("settings", {
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});