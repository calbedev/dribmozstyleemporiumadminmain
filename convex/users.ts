import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// QUERIES
// ===============================

export const getAll = query({
  args: { 
    deleted: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("users_sync");

    if (args.deleted !== undefined) {
      if (args.deleted) {
        query = query.filter((q) => q.neq(q.field("deleted_at"), undefined));
      } else {
        query = query.withIndex("by_deleted_at", (q) => q.eq("deleted_at", undefined));
      }
    }

    let users = await query.collect();

    if (args.limit) {
      users = users.slice(0, args.limit);
    }

    return users;
  },
});

export const getById = query({
  args: { id: v.id("users_sync") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users_sync").collect();
    return users.find(user => user.userId === args.userId) || null;
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users_sync").collect();
    return users.find(user => user.email === args.email) || null;
  },
});

// ===============================
// MUTATIONS
// ===============================

export const create = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    metadata: v.optional(v.any()),
    raw_json: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("users_sync", {
      ...args,
      created_at: now,
      updated_at: now,
      raw_json: {},   // agora sempre presente
      metadata: {},   // opcional
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("users_sync"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    raw_json: v.optional(v.any()),
    userId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    return await ctx.db.patch(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  },
});

export const softDelete = mutation({
  args: { id: v.id("users_sync") },
  handler: async (ctx, args) => {
    return await ctx.db.patch(args.id, {
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  },
});