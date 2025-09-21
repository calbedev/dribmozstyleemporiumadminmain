// convex/orders.ts
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ===============================
// QUERIES
// ===============================

export const getByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user= await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) return null;
    let orders = await ctx.db
      .query("Order")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (args.limit) {
      orders = orders.slice(0, args.limit);
    }

    return orders;
  },
});

export const getById = query({
  args: { id: v.id("Order") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) return null;

    const orderItems = await ctx.db
      .query("OrderItem")
      .withIndex("by_order", (q) => q.eq("orderIdForUser", args.id))
      .collect();

    return { order, items: orderItems };
  },
});

export const getStoreOrders = query({
  args: {
    storeId: v.id("stores"),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("StoreOrder")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId));

    let orders = await query.collect();

    if (args.status) {
      orders = orders.filter(order => order.status === args.status);
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (args.limit) {
      orders = orders.slice(0, args.limit);
    }

    return orders;
  },
});

// ===============================
// MUTATIONS
// ===============================

export const create = mutation({
  args: {
    userId: v.string(),
    cartId: v.id("Cart"),
    shippingAddressId: v.id("Address"),
    billingAddressId: v.optional(v.id("Address")),
    paymentMethod: v.optional(v.string()),
    shippingMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const user= await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) return null;

    // Get cart items
    const cartItems = await ctx.db
      .query("CartItem")
      .withIndex("by_cart", (q) => q.eq("cartId", args.cartId))
      .collect();

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // Calculate totals
    let subtotal = 0;
    const storeGroups: { [storeId: string]: typeof cartItems } = {};

    for (const item of cartItems) {
      const product = await ctx.db.get(item.productId);
      if (!product) continue;

      subtotal += item.price * item.quantity;

      if (!storeGroups[product.storeId]) {
        storeGroups[product.storeId] = [];
      }
      storeGroups[product.storeId].push(item);
    }
    
    const shippingAddress = await ctx.db.get(args.shippingAddressId);
    if (!shippingAddress) {
      throw new Error("Shipping address not found");
    }
    const neighborhood = await ctx.db.get(shippingAddress.neighborhood);
    const shipping = neighborhood?.shippingCost ?? 0

    //const shipping = 50; // Base shipping cost
    //const tax = subtotal * 0.16; // 17% IVA
    const total = subtotal + shipping;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create main user order
    const orderId = await ctx.db.insert("Order", {
      orderNumber,
      userId: user._id,
      status: "PENDING",
      subtotal,
      shipping,
      tax: 0,
      discount: 0,
      total,
      shippingAddressId: args.shippingAddressId,
      billingAddressId: args.billingAddressId,
      paymentMethod: args.paymentMethod as any,
      paymentStatus: "PENDING",
      shippingMethod: args.shippingMethod as any,
      createdAt: now,
      updatedAt: now,
    });

    // Create store orders for each store
    for (const [storeId, storeItems] of Object.entries(storeGroups)) {
      const storeSubtotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const storeShipping = 50;
      const storeTax = storeSubtotal * 0.17;
      const storeTotal = storeSubtotal + storeShipping + storeTax;

      const storeOrderId = await ctx.db.insert("StoreOrder", {
        orderNumber: `${orderNumber}-${storeId}`,
        userOrder: orderId,
        userId: user._id,
        storeId: storeId as any,
        status: "PENDING",
        subtotal: storeSubtotal,
        shipping: storeShipping,
        tax: storeTax,
        discount: 0,
        total: storeTotal,
        shippingAddressId: args.shippingAddressId,
        billingAddressId: args.billingAddressId,
        paymentMethod: args.paymentMethod as any,
        paymentStatus: "PENDING",
        shippingMethod: args.shippingMethod as any,
        createdAt: now,
        updatedAt: now,
      });

      // Create order items
      for (const item of storeItems) {
        await ctx.db.insert("OrderItem", {
          orderIdForUser: orderId,
          orderIdForStore: storeOrderId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        });

        // Update product stock
        const product = await ctx.db.get(item.productId);
        if (product) {
          await ctx.db.patch(item.productId, {
            stockCount: Math.max(0, product.stockCount - item.quantity),
            soldCount: product.soldCount + item.quantity,
            updatedAt: now,
          });
        }
      }
    }

    // Mark cart as purchased
    await ctx.db.patch(args.cartId, {
      isPurshed: true,
      updatedAt: now,
    });

    return { orderId, orderNumber };
  },
});

export const updateStatus = mutation({
  args: {
    orderId: v.id("Order"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    await ctx.db.patch(args.orderId, {
      status: args.status as any,
      updatedAt: now,
    });

    // Update related store orders
    const storeOrders = await ctx.db
      .query("StoreOrder")
      .filter((q) => q.eq(q.field("userOrder"), args.orderId))
      .collect();

    for (const storeOrder of storeOrders) {
      await ctx.db.patch(storeOrder._id, {
        status: args.status as any,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});


export const createOrderFromPayment = internalMutation({
  args: {
    userId: v.string(),
    cartItems: v.array(v.object({
      productId: v.id("Product"),
      variantId: v.optional(v.id("ProductVariant")),
      quantity: v.number(),
      price: v.number(),
    })),
    shippingAddress: v.object({
      block: v.number(),
      houseNumber: v.number(),
      neighborhood: v.id("Neighborhood"),
      buildingNumber: v.optional(v.number()),
      street: v.optional(v.string()),
      reference: v.optional(v.string()),
      city: v.string(),
      province: v.string(),
      zipCode: v.string(),
    }),
    paymentMethod: v.optional(v.string()),
    shippingMethod: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const user = await ctx.db
      .query("users_sync")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const addressId = await ctx.db.insert("Address", {
      ...args.shippingAddress,
      userId: user._id,
      isDefault: false, // For simplicity, we're not handling default address here
      createdAt: now,
      updatedAt: now,
    });

    // Calculate totals
    let subtotal = 0;
    const storeGroups: { [storeId: string]: any[] } = {};

    for (const item of args.cartItems) {
      const product = await ctx.db.get(item.productId);
      if (!product) continue;

      subtotal += item.price * item.quantity;

      if (!storeGroups[product.storeId]) {
        storeGroups[product.storeId] = [];
      }
      storeGroups[product.storeId].push(item);
    }

    
    const neighborhood = await ctx.db.get(args.shippingAddress.neighborhood);
    const shipping = neighborhood?.shippingCost ?? 0

    //const shipping = 50; // Base shipping cost
    //const tax = subtotal * 0.17; // 17% IVA
    const total = subtotal + shipping // + tax;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    // Create main user order
    const orderId = await ctx.db.insert("Order", {
      orderNumber,
      userId: user._id,
      status: "CONFIRMED",
      subtotal,
      shipping,
      tax: 0,
      discount: 0,
      total,
      shippingAddressId: addressId,
      paymentMethod: args.paymentMethod as any,
      paymentStatus: "PAID",
      shippingMethod: args.shippingMethod as any,
      createdAt: now,
      updatedAt: now,
    });

    // Create store orders for each store
    for (const [storeId, storeItems] of Object.entries(storeGroups)) {
      const storeSubtotal = storeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      const neighborhood = await ctx.db.get(args.shippingAddress.neighborhood);
      const storeShipping = neighborhood?.shippingCost ?? 0
      //const storeShipping = 50;
      //const storeTax = storeSubtotal * 0.17;
      const storeTotal = storeSubtotal + storeShipping //+ storeTax;

      const storeOrderId = await ctx.db.insert("StoreOrder", {
        orderNumber: `${orderNumber}-${storeId}`,
        userOrder: orderId,
        userId: user._id,
        storeId: storeId as any,
        status: "CONFIRMED",
        subtotal: storeSubtotal,
        shipping: storeShipping,
        tax: 0,
        discount: 0,
        total: storeTotal,
        shippingAddressId: addressId,
        paymentMethod: args.paymentMethod as any,
        paymentStatus: "PAID",
        shippingMethod: args.shippingMethod as any,
        createdAt: now,
        updatedAt: now,
      });

      // Create order items
      for (const item of storeItems) {
        await ctx.db.insert("OrderItem", {
          orderIdForUser: orderId,
          orderIdForStore: storeOrderId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price,
        });

        // Update product stock
        const product = await ctx.db.get(item.productId);
        
        if (product) {
          await ctx.db.patch(item.productId, {
            stockCount: Math.max(0, product.stockCount - item.quantity),
            soldCount: product.soldCount + item.quantity,
            updatedAt: now,
          });
        }
      }
    }

    // Mark cart as purchased
    if(args.cartItems.length > 0) {
      const cartId = (args.cartItems[0] as any).cartId;
      if (cartId) {
        await ctx.db.patch(cartId, {
            isPurshed: true,
            updatedAt: now,
        });
      }
    }


    return { orderId, orderNumber };
  },
});