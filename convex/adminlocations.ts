import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Neighborhoods
export const getNeighborhoods = query({
  args: {
    search: v.optional(v.string()),
    city: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let neighborhoods = ctx.db.query("neighborhoods")

    if (args.search) {
      neighborhoods = neighborhoods.filter((q) =>
        q.or(q.eq(q.field("name"), args.search), q.eq(q.field("city"), args.search)),
      )
    }

    if (args.city) {
      neighborhoods = neighborhoods.filter((q) => q.eq(q.field("city"), args.city))
    }

    if (args.active !== undefined) {
      neighborhoods = neighborhoods.filter((q) => q.eq(q.field("active"), args.active))
    }

    return await neighborhoods.collect()
  },
})

export const createNeighborhood = mutation({
  args: {
    name: v.string(),
    city: v.string(),
    state: v.string(),
    deliveryFee: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("neighborhoods", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

export const updateNeighborhood = mutation({
  args: {
    id: v.id("neighborhoods"),
    name: v.string(),
    city: v.string(),
    state: v.string(),
    deliveryFee: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args
    return await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    })
  },
})

export const deleteNeighborhood = mutation({
  args: { id: v.id("neighborhoods") },
  handler: async (ctx, args) => {
    return await ctx.db.delete(args.id)
  },
})

// Cities
export const getCities = query({
  args: { state: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let cities = ctx.db.query("cities")

    if (args.state) {
      cities = cities.filter((q) => q.eq(q.field("state"), args.state))
    }

    return await cities.collect()
  },
})

export const createCity = mutation({
  args: {
    name: v.string(),
    state: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("cities", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})

// States
export const getStates = query({
  handler: async (ctx) => {
    return await ctx.db.query("states").collect()
  },
})

export const createState = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("states", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
})
