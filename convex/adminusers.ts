import { query } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: {
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db.query("users_sync").filter((q) => q.eq(q.field("deleted_at"), undefined))

    let users = await query.collect()

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      users = users.filter(
        (user) => user.name?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower),
      )
    }

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Get order count and total spent
        const orders = await ctx.db
          .query("Order")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .collect()

        const completedOrders = orders.filter((order) => ["PAID", "SHIPPED", "DELIVERED"].includes(order.status))

        const totalSpent = completedOrders.reduce((sum, order) => sum + order.total, 0)

        // Get review count
        const reviews = await ctx.db.query("Review").collect()
        const userReviews = reviews.filter((review) => review.userId === user._id)

        return {
          ...user,
          orderCount: orders.length,
          completedOrderCount: completedOrders.length,
          totalSpent,
          reviewCount: userReviews.length,
          lastOrderDate: orders.length > 0 ? Math.max(...orders.map((o) => new Date(o.createdAt).getTime())) : null,
        }
      }),
    )

    // Sort by creation date (newest first)
    usersWithStats.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })

    // Apply pagination
    const offset = args.offset || 0
    const limit = args.limit || 20
    const paginatedUsers = usersWithStats.slice(offset, offset + limit)

    return {
      users: paginatedUsers,
      total: usersWithStats.length,
      hasMore: offset + limit < usersWithStats.length,
    }
  },
})

export const getById = query({
  args: { id: v.id("users_sync") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id)
    if (!user) return null

    // Get user's orders
    const orders = await ctx.db
      .query("Order")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect()

    // Get user's reviews
    const reviews = await ctx.db.query("Review").collect()
    const userReviews = reviews.filter((review) => review.userId === user._id)

    // Get user's addresses
    const addresses = await ctx.db
      .query("Address")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect()

    // Calculate stats
    const completedOrders = orders.filter((order) => ["PAID", "SHIPPED", "DELIVERED"].includes(order.status))
    const totalSpent = completedOrders.reduce((sum, order) => sum + order.total, 0)

    return {
      ...user,
      orders,
      reviews: userReviews,
      addresses,
      stats: {
        orderCount: orders.length,
        completedOrderCount: completedOrders.length,
        totalSpent,
        reviewCount: userReviews.length,
        addressCount: addresses.length,
        averageOrderValue: completedOrders.length > 0 ? totalSpent / completedOrders.length : 0,
      },
    }
  },
})

export const getStats = query({
  handler: async (ctx) => {
    const users = await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("deleted_at"), undefined))
      .collect()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const newUsersLast30Days = users.filter((user) => {
      const createdAt = new Date(user.created_at || 0)
      return createdAt >= thirtyDaysAgo
    }).length

    const newUsersLast7Days = users.filter((user) => {
      const createdAt = new Date(user.created_at || 0)
      return createdAt >= sevenDaysAgo
    }).length

    return {
      total: users.length,
      newLast30Days: newUsersLast30Days,
      newLast7Days: newUsersLast7Days,
    }
  },
})
