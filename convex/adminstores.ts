import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const listStores = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    //const identity = await ctx.auth.getUserIdentity()
    //if (!identity) throw new Error("Não autenticado")

    let query = ctx.db.query("stores")

    if (args.search) {
      query = query.filter((q) => q.or(q.eq(q.field("name"), args.search), q.eq(q.field("slug"), args.search)))
    }

    const stores = await query.collect()

    // Get member count for each store
    const storesWithStats = await Promise.all(
      stores.map(async (store) => {
        const memberCount = await ctx.db
          .query("team_members")
          .filter((q) => q.eq(q.field("storeId"), store._id))
          .collect()
          .then((members) => members.length)

        return {
          ...store,
          memberCount,
        }
      }),
    )


    return { stores: storesWithStats }
  },
})

export const createStore = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    logo: v.optional(v.id("_storage")),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Não autenticado")

    // Check if slug already exists
    const existing = await ctx.db
      .query("stores")
      .filter((q) => q.eq(q.field("slug"), args.slug))
      .first()

    if (existing) {
      throw new Error("Slug já está em uso")
    }

    return await ctx.db.insert("stores", {
      ...args,
      status: "active",
      createdAt: new Date().toISOString(),
      createdBy: identity.subject,
    })
  },
})

export const updateStore = mutation({
  args: {
    storeId: v.id("stores"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.id("_storage")),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Não autenticado")

    const { storeId, ...updates } = args

    // Check slug uniqueness if updating slug
    if (updates.slug) {
      const existing = await ctx.db
        .query("stores")
        .filter((q) => q.and(q.eq(q.field("slug"), updates.slug), q.neq(q.field("_id"), storeId)))
        .first()

      if (existing) {
        throw new Error("Slug já está em uso")
      }
    }

    return await ctx.db.patch(storeId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    })
  },
})

export const deleteStore = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error("Não autenticado")

    // Delete all team members first
    const members = await ctx.db
      .query("team_members")
      .filter((q) => q.eq(q.field("storeId"), args.storeId))
      .collect()

    for (const member of members) {
      await ctx.db.delete(member._id)
    }

    return await ctx.db.delete(args.storeId)
  },
})

export const getStore = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.storeId)
  },
})


export const getUserStores = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // 1. Confirma se o user existe em users_sync
    const usery = "787cb2fc-e7a8-489a-b137-6463621d570d"
    const user = await ctx.db
      .query("users_sync")
      .withIndex("by_userId", (q) => q.eq("userId", usery))
      .first();
    console.log("User encontrado", user);

    if (!user) {
      return []; // usuário não encontrado
    }

    // 2. Buscar vínculos em team_members
    const memberships = await ctx.db
      .query("team_members")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    console.log("Vínculos encontrados", memberships);

    if (memberships.length === 0) {
      return []; // usuário não vinculado a nenhuma loja
    }

    // 3. Buscar lojas associadas aos vínculos
    const stores = await Promise.all(
      memberships.map(async (m) => {
        return await ctx.db.get(m.storeId); // assumindo que existe storeId em team_members
      })
    );
    console.log("Lojas encontradas", stores);

    // 4. Retornar apenas lojas válidas
    return stores.filter((s) => s !== null);
  },
});
