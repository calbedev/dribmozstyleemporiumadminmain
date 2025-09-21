import { query } from "./_generated/server"
import { v } from "convex/values"

export const getKPIs = query({
  args: {
    period: v.optional(v.union(v.literal("today"), v.literal("7d"), v.literal("30d"), v.literal("ytd"))),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    storeId: v.id("stores"), // Tornou obrigatório para garantir filtro por loja
  },
  handler: async (ctx, args) => {
    const period = args.period || "30d"
    const now = new Date()
    let startDate: Date

    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "ytd":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    const startDateStr = startDate.toISOString()
    const endDateStr = now.toISOString()

    const orders = await ctx.db
      .query("StoreOrder")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .filter((q) =>
        q.and(
          q.gte(q.field("createdAt"), startDateStr),
          q.lte(q.field("createdAt"), endDateStr),
          q.or(
            q.eq(q.field("status"), "PAID"),
            q.eq(q.field("status"), "SHIPPED"),
            q.eq(q.field("status"), "DELIVERED"),
          ),
        ),
      )
      .collect()

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
    const orderCount = orders.length
    const averageTicket = orderCount > 0 ? totalRevenue / orderCount : 0

    // Get unique customers (new customers in period)
    const uniqueCustomers = new Set(orders.map((order) => order.userId)).size

    const orderItems = await ctx.db
      .query("OrderItem")
      .filter((q) => q.or(...orders.map((order) => q.eq(q.field("orderId"), order._id))))
      .collect()

    const productSales = new Map<string, { quantity: number; revenue: number; name: string }>()

    for (const item of orderItems) {
      const product = await ctx.db.get(item.productId)
      if (product && product.storeId === args.storeId) {
        const existing = productSales.get(item.productId) || { quantity: 0, revenue: 0, name: product.name }
        productSales.set(item.productId, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.price * item.quantity,
          name: product.name,
        })
      }
    }

    const bestSelling = Array.from(productSales.entries())
      .map(([id, data]) => ({ productId: id, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    return {
      totalRevenue,
      orderCount,
      averageTicket,
      newCustomers: uniqueCustomers,
      bestSelling,
      period,
    }
  },
})

export const getRecentOrders = query({
  args: {
    limit: v.optional(v.number()),
    storeId: v.id("stores"), // Tornou obrigatório
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10

    const orders = await ctx.db
      .query("StoreOrder")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .order("desc")
      .take(limit)

    const ordersWithUser = await Promise.all(
      orders.map(async (order) => {
        const user = await ctx.db.get(order.userId)
        return {
          ...order,
          userName: user?.name || "Unknown User",
        }
      }),
    )

    return ordersWithUser
  },
})

export const getLowStockProducts = query({
  args: {
    threshold: v.optional(v.number()),
    storeId: v.id("stores"), // Tornou obrigatório
  },
  handler: async (ctx, args) => {
    const threshold = args.threshold || 5

    const products = await ctx.db
      .query("Product")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.lte(q.field("stockCount"), threshold))
      .collect()

    return products.map((product) => ({
      id: product._id,
      name: product.name,
      stockCount: product.stockCount,
      minStock: product.minStock,
      isOutOfStock: product.stockCount === 0,
    }))
  },
})

export const getAbandonedCarts = query({
  args: {
    hoursThreshold: v.optional(v.number()),
    storeId: v.id("stores"), // Adicionado storeId para filtrar carrinhos por loja
  },
  handler: async (ctx, args) => {
    const hoursThreshold = args.hoursThreshold || 24
    const cutoffTime = new Date(Date.now() - hoursThreshold * 60 * 60 * 1000).toISOString()

    const abandonedCarts = await ctx.db
      .query("Cart")
      .filter((q) => q.and(q.lt(q.field("updatedAt"), cutoffTime), q.eq(q.field("isPurshed"), false)))
      .collect()

    const cartsWithItems = await Promise.all(
      abandonedCarts.map(async (cart) => {
        const items = await ctx.db
          .query("CartItem")
          .withIndex("by_cart", (q) => q.eq("cartId", cart._id))
          .collect()

        const storeItems = []
        for (const item of items) {
          const product = await ctx.db.get(item.productId)
          if (product && product.storeId === args.storeId) {
            storeItems.push(item)
          }
        }

        const total = storeItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

        // Só retorna carrinho se tiver itens da loja
        return storeItems.length > 0
          ? {
              ...cart,
              itemCount: storeItems.length,
              total,
            }
          : null
      }),
    )

    // Remove carrinho vazios (null)
    return cartsWithItems.filter((cart) => cart !== null)
  },
})

export const getPendingReviews = query({
  args: { storeId: v.id("stores") }, // Já estava correto
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("Review")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .filter((q) => q.eq(q.field("isApproved"), false))
      .collect()

    return pending.length
  },
})
