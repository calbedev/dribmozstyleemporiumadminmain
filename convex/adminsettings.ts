import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const getSettings = query({
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first()
    return (
      settings || {
        // Default settings
        storeName: "Minha Loja",
        storeDescription: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        freeShippingThreshold: 0,
        defaultShippingFee: 0,
        taxRate: 0,
        currency: "MZN",
        businessHours: {},
        socialMedia: {},
        seoSettings: {},
        paymentMethods: [],
        emailSettings: {},
      }
    )
  },
})

export const updateSettings = mutation({
  args: {
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
    const existing = await ctx.db.query("settings").first()

    if (existing) {
      return await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: Date.now(),
      })
    } else {
      return await ctx.db.insert("settings", {
        ...args,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
  },
})
