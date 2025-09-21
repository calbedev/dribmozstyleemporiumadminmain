// convex/products.ts
import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// ===============================
// INTERNAL QUERIES
// ===============================
export const get = internalQuery({
  args: { id: v.id("Product") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ===============================
// QUERIES
// ===============================

export const getAll = query({
  args: {
    storeId: (v.id("stores")),
    isPublished: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("Product");
    
    if (args.storeId) {
      query = query.withIndex("by_store", (q) => q.eq("storeId", args.storeId));
    }
    
    if (args.isPublished !== undefined) {
      query = query.filter((q) => q.eq(q.field("isPublished"), args.isPublished));
    }

    let products = await query.collect();
    
    if (args.limit) {
      products = products.slice(0, args.limit);
    }

    return products;
  },
});

export const getById = query({
  args: { id: v.id("Product") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByCategory = query({
  args: { 
    categoryId: v.id("Category"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("Product")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    if (args.limit) {
      products = products.slice(0, args.limit);
    }

    return products;
  },
});

export const getFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("Product")
      .filter((q) => 
        q.and(
          q.eq(q.field("isFeatured"), true),
          q.eq(q.field("isPublished"), true)
        )
      )
      .collect();

    if (args.limit) {
      products = products.slice(0, args.limit);
    }

    return products;
  },
});

export const getBestSellers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("Product")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    // Sort by soldCount descending
    products.sort((a, b) => b.soldCount - a.soldCount);

    if (args.limit) {
      products = products.slice(0, args.limit);
    }

    return products;
  },
});

export const getDiscounted = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("Product")
      .filter((q) => 
        q.and(
          q.gt(q.field("originalPrice"), q.field("price")),
          q.eq(q.field("isPublished"), true)
        )
      )
      .collect();

    if (args.limit) {
      products = products.slice(0, args.limit);
    }

    return products;
  },
});

export const search = query({
  args: { 
    query: v.string(),
    categoryId: v.optional(v.id("Category")),
    brandId: v.optional(v.id("Brand")),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    sortBy: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let products = await ctx.db
      .query("Product")
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    // Filter by search query
    if (args.query) {
      const searchTerm = args.query.toLowerCase();
      products = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by category
    if (args.categoryId) {
      products = products.filter(product => product.categoryId === args.categoryId);
    }

    // Filter by brand
    if (args.brandId) {
      products = products.filter(product => product.brandId === args.brandId);
    }

    // Filter by price range
    if (args.minPrice !== undefined) {
      products = products.filter(product => product.price >= args.minPrice!);
    }
    if (args.maxPrice !== undefined) {
      products = products.filter(product => product.price <= args.maxPrice!);
    }

    // Sort products
    switch (args.sortBy) {
      case 'price-asc':
        products.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        products.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        products.sort((a, b) => b.avgRating - a.avgRating);
        break;
      case 'newest':
        products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        products.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (args.limit) {
      products = products.slice(0, args.limit);
    }

    return products;
  },
});

// ===============================
// MUTATIONS
// ===============================

export const create = mutation({
  args: {
    storeId: v.id("stores"),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.optional(v.string()),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    images: v.array(v.string()),
    thumbnail: v.string(),
    categoryId: v.id("Category"),
    brandId: v.optional(v.id("Brand")),
    stockCount: v.number(),
    minStock: v.number(),
    metaTitle: v.optional(v.string()),
    metaDesc: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    return await ctx.db.insert("Product", {
      ...args,
      avgRating: 0,
      reviewCount: 0,
      isNew: true,
      isFeatured: false,
      isPublished: false,
      inStock: args.stockCount > 0,
      soldCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateStock = mutation({
  args: {
    productId: v.id("Product"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    const newStockCount = Math.max(0, product.stockCount - args.quantity);
    const newSoldCount = product.soldCount + args.quantity;

    await ctx.db.patch(args.productId, {
      stockCount: newStockCount,
      soldCount: newSoldCount,
      inStock: newStockCount > 0,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Em convex/products.ts (ou onde as tuas queries de produtos estão)

// ✨ NOVA QUERY ✨
export const getByIds = query({
  // Recebe um array de IDs de produtos
  args: {
    productIds: v.array(v.id("Product")),
  },
  handler: async (ctx, args) => {
    // Se o array de IDs estiver vazio, retorna um array vazio imediatamente
    if (args.productIds.length === 0) {
      return [];
    }

    // Usa Promise.all para buscar todos os produtos em paralelo
    const products = await Promise.all(
      args.productIds.map((productId) => ctx.db.get(productId))
    );
    
    // Filtra quaisquer resultados nulos (caso um produto tenha sido apagado)
    // e garante que o TypeScript entenda o tipo do retorno
    return products.filter(
      (product): product is NonNullable<typeof product> => product !== null
    );
  },
});