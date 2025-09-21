import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

export const listTeamMembers = query({
  args: {
    storeId: v.optional(v.id("stores")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    //const identity = await ctx.auth.getUserIdentity()
    //if (!identity) throw new Error("Não autenticado")

    let query = ctx.db.query("team_members")

    if (args.storeId) {
      query = query.filter((q) => q.eq(q.field("storeId"), args.storeId))
    }

    if (args.search) {
      query = query.filter((q) => q.or(q.eq(q.field("email"), args.search), q.eq(q.field("name"), args.search)))
    }

    const members = await query.collect()

    const membersWithStores = await Promise.all(
      members.map(async (member) => ({
        ...member,
        store: member.storeId ? await ctx.db.get(member.storeId) : null,
      })),
    )

    return {
      members: membersWithStores,
    }
  },
})

export const inviteTeamMember = mutation({
  args: {
    email: v.string(),
    role: v.union(
      v.literal("owner"),
      v.literal("moderator"),
      v.literal("editor"),
      v.literal("shipper"),
      v.literal("viewer"),
    ),
    storeId: v.id("stores"),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    //const identity = await ctx.auth.getUserIdentity()
    //if (!identity) throw new Error("Não autenticado")
    const user = await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first()
    if (!user) {
      throw new Error("Usuário com este email não encontrado")
    }
    // Check if member already exists
    const existing = await ctx.db
      .query("team_members")
      .filter((q) => q.and(q.eq(q.field("email"), args.email), q.eq(q.field("storeId"), args.storeId)))
      .first()

    if (existing) {
      throw new Error("Usuário já é membro desta loja")
    }

    return await ctx.db.insert("team_members", {
      userId: user._id, //
      email: args.email,
      name: args.name || "",
      role: args.role,
      storeId: args.storeId,
      status: "pending",
      invitedAt: new Date().toISOString(),
      invitedBy: "identity.subject", // Replace with actual inviter ID
    })
  },
})

export const updateTeamMemberRole = mutation({
  args: {
    memberId: v.id("team_members"),
    role: v.union(
      v.literal("owner"),
      v.literal("moderator"),
      v.literal("editor"),
      v.literal("shipper"),
      v.literal("viewer"),
    ),
  },
  handler: async (ctx, args) => {
    //const identity = await ctx.auth.getUserIdentity()
    //if (!identity) throw new Error("Não autenticado")

    return await ctx.db.patch(args.memberId, {
      role: args.role,
      updatedAt: new Date().toISOString(),
    })
  },
})

export const removeTeamMember = mutation({
  args: { memberId: v.id("team_members") },
  handler: async (ctx, args) => {
    //const identity = await ctx.auth.getUserIdentity()
    //if (!identity) throw new Error("Não autenticado")

    return await ctx.db.delete(args.memberId)
  },
})

export const getUserRole = query({
  args: {
    userId: v.string(),
    storeId: v.id("stores"), // ajusta "stores" para o nome real da tua tabela de lojas
  },
  handler: async (ctx, { userId, storeId }) => {
    const user = await ctx.db
      .query("users_sync")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    console.log("User encontrado", user);

    if (!user) {
      return null; // usuário não encontrado
    }
    
    const membership = await ctx.db
      .query("team_members")
      .withIndex("by_user_store", (q) =>
        q.eq("userId", user._id).eq("storeId", storeId)
      )
      .first();

    if (!membership) {
      return null; // usuário não faz parte desta loja
    }

    return membership.role; // retorna apenas o role
  },
});
