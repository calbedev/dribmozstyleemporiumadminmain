import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const list = query({
  args: {
    search: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("PENDING"),
        v.literal("CONFIRMED"),
        v.literal("PROCESSING"),
        v.literal("SHIPPED"),
        v.literal("DELIVERED"),
        v.literal("CANCELLED"),
        v.literal("REFUNDED"),
      ),
    ),
    paymentStatus: v.optional(
      v.union(v.literal("PENDING"), v.literal("PAID"), v.literal("FAILED"), v.literal("REFUNDED")),
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    minValue: v.optional(v.number()),
    maxValue: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Order")

    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status))
    } else {
      query = query.withIndex("by_createdAt")
    }

    let orders = await query.order("desc").collect()

    // Apply filters
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      orders = orders.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.trackingNumber?.toLowerCase().includes(searchLower),
      )
    }

    if (args.paymentStatus) {
      orders = orders.filter((order) => order.paymentStatus === args.paymentStatus)
    }

    if (args.startDate) {
      orders = orders.filter((order) => order.createdAt >= args.startDate!)
    }

    if (args.endDate) {
      orders = orders.filter((order) => order.createdAt <= args.endDate!)
    }

    if (args.minValue) {
      orders = orders.filter((order) => order.total >= args.minValue!)
    }

    if (args.maxValue) {
      orders = orders.filter((order) => order.total <= args.maxValue!)
    }

    // Get related data
    const ordersWithRelations = await Promise.all(
      orders.map(async (order) => {
        const user = await ctx.db.get(order.userId)
        const shippingAddress = await ctx.db.get(order.shippingAddressId)
        const neighborhood = shippingAddress?.neighborhood ? await ctx.db.get(shippingAddress.neighborhood) : null

        return {
          ...order,
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "",
          shippingCity: shippingAddress?.city || "",
          shippingNeighborhood: neighborhood?.name || "",
        }
      }),
    )

    // Apply pagination
    const offset = args.offset || 0
    const limit = args.limit || 20
    const paginatedOrders = ordersWithRelations.slice(offset, offset + limit)

    return {
      orders: paginatedOrders,
      total: ordersWithRelations.length,
      hasMore: offset + limit < ordersWithRelations.length,
    }
  },
})

export const getById = query({
  args: { id: v.id("StoreOrder") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id)
    if (!order) return null

    // Get user
    const user = await ctx.db.get(order.userId)

    // Get addresses
    const shippingAddress = await ctx.db.get(order.shippingAddressId)
    const billingAddress = order.billingAddressId ? await ctx.db.get(order.billingAddressId) : null

    // Get neighborhood for shipping address
    const shippingNeighborhood = shippingAddress?.neighborhood ? await ctx.db.get(shippingAddress.neighborhood) : null

    // Get order items
    const orderItems = await ctx.db
      .query("OrderItem")
      .withIndex("by_storeOrder", (q) => q.eq("orderIdForStore", order._id))
      .collect()

    // Get product details for each item
    const itemsWithProducts = await Promise.all(
      orderItems.map(async (item) => {
        const product = await ctx.db.get(item.productId)
        const variant = item.variantId ? await ctx.db.get(item.variantId) : null

        let variantDetails = null
        if (variant) {
          const color = variant.colorId ? await ctx.db.get(variant.colorId) : null
          const size = variant.sizeId ? await ctx.db.get(variant.sizeId) : null
          variantDetails = {
            ...variant,
            color: color ? { name: color.name, hexCode: color.hexCode } : null,
            size: size ? { name: size.name } : null,
          }
        }

        return {
          ...item,
          product: product
            ? {
                name: product.name,
                thumbnail: product.thumbnail,
                slug: product.slug,
              }
            : null,
          variant: variantDetails,
        }
      }),
    )

    return {
      ...order,
      user: user
        ? {
            name: user.name,
            email: user.email,
          }
        : null,
      shippingAddress: shippingAddress
        ? {
            ...shippingAddress,
            neighborhood: shippingNeighborhood,
          }
        : null,
      billingAddress,
      items: itemsWithProducts,
    }
  },
})

export const updateStatus = mutation({
  args: {
    id: v.id("Order"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("CONFIRMED"),
      v.literal("PROCESSING"),
      v.literal("SHIPPED"),
      v.literal("DELIVERED"),
      v.literal("CANCELLED"),
      v.literal("REFUNDED"),
    ),
    trackingNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id)
    if (!order) throw new Error("Pedido não encontrado")

    const now = new Date().toISOString()
    const updateData: any = {
      status: args.status,
      updatedAt: now,
    }

    // Set specific timestamps based on status
    switch (args.status) {
      case "SHIPPED":
        updateData.shippedAt = now
        if (args.trackingNumber) {
          updateData.trackingNumber = args.trackingNumber
        }
        break
      case "DELIVERED":
        updateData.deliveredAt = now
        if (!order.shippedAt) {
          updateData.shippedAt = now
        }
        break
      case "CANCELLED":
      case "REFUNDED":
        // These statuses can be set from any previous status
        break
    }

    await ctx.db.patch(args.id, updateData)

    // TODO: Create order history/timeline entry
    // await ctx.db.insert("OrderHistory", {
    //   orderId: args.id,
    //   status: args.status,
    //   notes: args.notes,
    //   createdAt: now,
    // })

    return { id: args.id, status: args.status }
  },
})

export const updatePaymentStatus = mutation({
  args: {
    id: v.id("Order"),
    paymentStatus: v.union(v.literal("PENDING"), v.literal("PAID"), v.literal("FAILED"), v.literal("REFUNDED")),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString()
    const updateData: any = {
      paymentStatus: args.paymentStatus,
      updatedAt: now,
    }

    if (args.paymentStatus === "PAID") {
      updateData.paidAt = now
    }

    await ctx.db.patch(args.id, updateData)
    return { id: args.id, paymentStatus: args.paymentStatus }
  },
})

export const getStatusStats = query({
  handler: async (ctx) => {
    const orders = await ctx.db.query("Order").collect()

    const stats = {
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    }

    orders.forEach((order) => {
      stats[order.status]++
    })

    return stats
  },
})

export const listStoreOrders = query({
  args: {
    storeId: v.optional(v.id("stores")),
    search: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("PENDING"),
        v.literal("CONFIRMED"),
        v.literal("PROCESSING"),
        v.literal("SHIPPED"),
        v.literal("DELIVERED"),
        v.literal("CANCELLED"),
        v.literal("REFUNDED"),
      ),
    ),
    paymentStatus: v.optional(
      v.union(v.literal("PENDING"), v.literal("PAID"), v.literal("FAILED"), v.literal("REFUNDED")),
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    minValue: v.optional(v.number()),
    maxValue: v.optional(v.number()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("StoreOrder")

    if (args.storeId) {
      query = query.withIndex("by_store", (q) => q.eq("storeId", args.storeId))
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status))
    }

    let orders = await query.order("desc").collect()

    // Apply filters
    if (args.search) {
      const searchLower = args.search.toLowerCase()
      orders = orders.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.trackingNumber?.toLowerCase().includes(searchLower),
      )
    }

    if (args.paymentStatus) {
      orders = orders.filter((order) => order.paymentStatus === args.paymentStatus)
    }

    if (args.startDate) {
      orders = orders.filter((order) => order.createdAt >= args.startDate!)
    }

    if (args.endDate) {
      orders = orders.filter((order) => order.createdAt <= args.endDate!)
    }

    if (args.minValue) {
      orders = orders.filter((order) => order.total >= args.minValue!)
    }

    if (args.maxValue) {
      orders = orders.filter((order) => order.total <= args.maxValue!)
    }

    // Get related data
    const ordersWithRelations = await Promise.all(
      orders.map(async (order) => {
        const user = await ctx.db.get(order.userId)
        const store = await ctx.db.get(order.storeId)
        const shippingAddress = await ctx.db.get(order.shippingAddressId)
        const neighborhood = shippingAddress?.neighborhood ? await ctx.db.get(shippingAddress.neighborhood) : null

        return {
          ...order,
          userName: user?.name || "Unknown User",
          userEmail: user?.email || "",
          storeName: store?.name || "Unknown Store",
          shippingCity: shippingAddress?.city || "",
          shippingNeighborhood: neighborhood?.name || "",
        }
      }),
    )

    // Apply pagination
    const offset = args.offset || 0
    const limit = args.limit || 20
    const paginatedOrders = ordersWithRelations.slice(offset, offset + limit)

    return {
      orders: paginatedOrders,
      total: ordersWithRelations.length,
      hasMore: offset + limit < ordersWithRelations.length,
    }
  },
})

export const getStoreOrderStatusStats = query({
  args: {
    storeId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("StoreOrder")

    if (args.storeId) {
      query = query.withIndex("by_store", (q) => q.eq("storeId", args.storeId))
    }

    const orders = await query.collect()

    const stats = {
      PENDING: 0,
      CONFIRMED: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
      REFUNDED: 0,
    }

    orders.forEach((order) => {
      stats[order.status]++
    })

    return stats
  },
})
