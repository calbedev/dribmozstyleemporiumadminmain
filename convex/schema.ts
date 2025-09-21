import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
  // ===============================
  // USERS
  // ===============================
  users_sync: defineTable({
    raw_json: v.any(),
    userId: v.string(), // ID do usuario no sistema de autenticacao (stackAuth)
    name: v.string(),
    email: v.string(),
    metadata: v.optional(v.any()), // Dados adicionais do usuario
    created_at: v.string(), // usar ISODate string
    updated_at: v.string(),
    deleted_at: v.optional(v.string()),
  }).index("by_deleted_at", ["deleted_at"])
    .index("by_userId", ["userId"]),

  // ===============================
  // STORES
  // ===============================
  stores: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    logo: v.optional(v.id("_storage")),
    website: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
    createdBy: v.string(), // User ID who created the store
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  // ===============================
  // TEAM MEMBERS
  // ===============================
  team_members: defineTable({
    userId: v.id("users_sync"), //
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(
      v.literal("superadmin"), // Dono da plataforma, pode gerenciar todas lojas e usuarios
      v.literal("owner"), // Dono da loja, pode gerenciar a loja e usuarios
      v.literal("moderator"), // Para gerenciar reviews dos comentarios dos produtos
      v.literal("editor"), // Pode gerenciar produtos, categorias, marcas, tags, slides
      v.literal("shipper"), // Pode gerenciar pedidos e envios
      v.literal("viewer"), // Pode ver os dados da loja, mas nao pode editar nada
    ),
    storeId: v.id("stores"),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("inactive")),
    invitedAt: v.string(),
    invitedBy: v.string(), // User ID who sent the invitation
    updatedAt: v.optional(v.string()),
  })
    .index("by_store", ["storeId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_user_store", ["userId", "storeId"])
    .index("by_userId", ["userId"]),

  // ===============================
  // SLIDES (marketing banners)
  // ===============================
  Slide: defineTable({
    title: v.string(),
    subtitle: v.string(),
    description: v.string(),
    image: v.string(),
    cta: v.string(),
    href: v.string(),
    storeId: v.id("stores"), // Adicionado storeId para associar slides às lojas
    isActive: v.boolean(), // Adicionado campo isActive para controlar visibilidade
    sortOrder: v.number(), // Adicionado campo sortOrder para ordenação
    createdAt: v.string(), // Adicionado campo createdAt
    updatedAt: v.string(), // Adicionado campo updatedAt
  })
    .index("by_store", ["storeId"]) // Adicionado índice by_store para filtrar slides por loja
    .index("by_store_active", ["storeId", "isActive"]), // Adicionado índice composto para filtrar slides ativos por loja

  // ===============================
  // CATEGORY
  // ===============================
  Category: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    parentId: v.optional(v.id("Category")),
    metaTitle: v.optional(v.string()),
    metaDesc: v.optional(v.string()),
    isActive: v.boolean(),
    sortOrder: v.number(),
  })
    .index("by_parent", ["parentId"])
    .index("by_isActive_sortOrder", ["isActive", "sortOrder"]),

  // ===============================
  // BRAND
  // ===============================
  Brand: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    website: v.optional(v.string()),
    isActive: v.boolean(),
  }).index("by_isActive", ["isActive"]),

  // ===============================
  // PRODUCT
  // ===============================
  Product: defineTable({
    storeId: v.id("stores"),
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    shortDesc: v.optional(v.string()),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    images: v.array(v.string()),
    thumbnail: v.string(),
    avgRating: v.number(),
    reviewCount: v.number(),
    isNew: v.boolean(),
    isFeatured: v.boolean(),
    isPublished: v.boolean(),
    inStock: v.boolean(),
    stockCount: v.number(),
    soldCount: v.number(),
    minStock: v.number(),
    categoryId: v.id("Category"),
    brandId: v.optional(v.id("Brand")),
    metaTitle: v.optional(v.string()),
    metaDesc: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    publishedAt: v.optional(v.string()),
  })
    .index("by_category", ["categoryId"])
    .index("by_brand", ["brandId"])
    .index("by_isPublished_inStock", ["isPublished", "inStock"])
    .index("by_avgRating", ["avgRating"])
    .index("by_price", ["price"])
    .index("by_createdAt", ["createdAt"])
    .index("by_slug", ["slug"])
    .index("by_store", ["storeId"]),

  // ===============================
  // PRODUCT VARIANT
  // ===============================
  ProductVariant: defineTable({
    productId: v.id("Product"),
    colorId: v.optional(v.id("Color")),
    sizeId: v.optional(v.id("Size")),
    priceAdjust: v.number(),
    stockCount: v.number(),
    sku: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_product", ["productId"])
    .index("by_sku", ["sku"]),

  // ===============================
  // COLOR
  // ===============================
  Color: defineTable({
    name: v.string(),
    hexCode: v.string(),
    isActive: v.boolean(),
  }).index("by_isActive", ["isActive"]),

  // ===============================
  // SIZE
  // ===============================
  Size: defineTable({
    name: v.string(),
    category: v.string(),
    sortOrder: v.number(),
    isActive: v.boolean(),
  })
    .index("by_category_sortOrder", ["category", "sortOrder"])
    .index("by_isActive", ["isActive"]),

  // ===============================
  // TAG
  // ===============================
  Tag: defineTable({
    name: v.string(),
    slug: v.string(),
    color: v.string(),
    isActive: v.boolean(),
  }).index("by_isActive", ["isActive"]),

  // ===============================
  // PRODUCT ↔ TAG (many-to-many)
  // ===============================
  ProductTag: defineTable({
    productId: v.id("Product"),
    tagId: v.id("Tag"),
  }),

  // ===============================
  // REVIEW
  // ===============================
  Review: defineTable({
    rating: v.number(),
    title: v.optional(v.string()),
    comment: v.string(),
    productId: v.id("Product"),
    userId: v.id("users_sync"),
    storeId: v.id("stores"),
    isApproved: v.boolean(),
    isHelpful: v.number(),
    isVerifiedPurchase: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_product_isApproved", ["productId", "isApproved"])
    .index("by_rating", ["rating"])
    .index("by_createdAt", ["createdAt"])
    .index("by_store", ["storeId"]), // Adicionado índice by_store para filtrar reviews por loja

  // ===============================
  // CART
  // ===============================
  Cart: defineTable({
    userId: v.optional(v.id("users_sync")),
    sessionId: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
    expiresAt: v.optional(v.string()),
    isPurshed: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"])
    .index("by_expires", ["expiresAt"]),

  // ===============================
  // CART ITEM
  // ===============================
  CartItem: defineTable({
    cartId: v.id("Cart"),
    productId: v.id("Product"),
    variantId: v.optional(v.id("ProductVariant")),
    quantity: v.number(),
    price: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_cart", ["cartId"]),

  // ===============================
  // ORDER // For users' purchases
  // ===============================
  Order: defineTable({
    orderNumber: v.string(),
    userId: v.id("users_sync"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("CONFIRMED"),
      v.literal("PROCESSING"),
      v.literal("SHIPPED"),
      v.literal("DELIVERED"),
      v.literal("CANCELLED"),
      v.literal("REFUNDED"),
    ),
    subtotal: v.number(),
    shipping: v.number(),
    tax: v.number(),
    discount: v.number(),
    total: v.number(),
    shippingAddressId: v.id("Address"),
    billingAddressId: v.optional(v.id("Address")),
    paymentMethod: v.optional(
      v.union(v.literal("MPESA"), v.literal("EMOLA"), v.literal("MKESH"), v.literal("CREDIT_CARD")),
    ),
    paymentStatus: v.union(v.literal("PENDING"), v.literal("PAID"), v.literal("FAILED"), v.literal("REFUNDED")),
    paidAt: v.optional(v.string()),
    shippingMethod: v.optional(v.union(v.literal("STANDARD"), v.literal("EXPRESS"), v.literal("FREE"))),
    trackingNumber: v.optional(v.string()),
    shippedAt: v.optional(v.string()),
    deliveredAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_orderNumber", ["orderNumber"]),

  // ===============================
  // ORDER // For store's sales
  // ===============================
  StoreOrder: defineTable({
    orderNumber: v.string(),
    userOrder: v.id("Order"),
    userId: v.id("users_sync"),
    storeId: v.id("stores"),
    status: v.union(
      v.literal("PENDING"),
      v.literal("CONFIRMED"),
      v.literal("PROCESSING"),
      v.literal("SHIPPED"),
      v.literal("DELIVERED"),
      v.literal("CANCELLED"),
      v.literal("REFUNDED"),
    ),
    subtotal: v.number(),
    shipping: v.number(),
    tax: v.number(),
    discount: v.number(),
    total: v.number(),
    shippingAddressId: v.id("Address"),
    billingAddressId: v.optional(v.id("Address")),
    paymentMethod: v.optional(
      v.union(v.literal("MPESA"), v.literal("EMOLA"), v.literal("MKESH"), v.literal("CREDIT_CARD")),
    ),
    paymentStatus: v.union(v.literal("PENDING"), v.literal("PAID"), v.literal("FAILED"), v.literal("REFUNDED")),
    paidAt: v.optional(v.string()),
    shippingMethod: v.optional(v.union(v.literal("STANDARD"), v.literal("EXPRESS"), v.literal("FREE"))),
    trackingNumber: v.optional(v.string()),
    shippedAt: v.optional(v.string()),
    deliveredAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_orderNumber", ["orderNumber"])
    .index("by_store", ["storeId"])
    .index("userOrder_store", ["userOrder", "storeId"]),

  // ===============================
  // ORDER ITEM
  // ===============================
  OrderItem: defineTable({
    orderIdForUser: v.id("Order"),
    orderIdForStore: v.id("StoreOrder"),
    productId: v.id("Product"),
    variantId: v.optional(v.id("ProductVariant")),
    quantity: v.number(),
    price: v.number(),
  })
    .index("by_order", ["orderIdForUser"])
    .index("by_storeOrder", ["orderIdForStore"]),

  // ===============================
  // ADDRESS
  // ===============================
  Address: defineTable({
    userId: v.id("users_sync"),
    block: v.number(),
    houseNumber: v.number(),
    neighborhood: v.id("Neighborhood"),
    buildingNumber: v.optional(v.number()),
    street: v.optional(v.string()),
    reference: v.optional(v.string()), // Referencio (Por exemplo, o usauario vai escrever "perto da loja X")
    city: v.string(),
    province: v.string(),
    zipCode: v.string(),
    isDefault: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),

  // ===============================
  // NEIGHBORHOOD
  // ===============================
  Neighborhood: defineTable({
    name: v.string(),
    city: v.string(),
    province: v.string(),
    shippingCost: v.number(),
    isActive: v.boolean(),
  }).index("by_isActive", ["isActive"]),

  // ===============================
  // LOCATIONS AND SETTINGS MANAGEMENT
  // ===============================

  cities: defineTable({
    name: v.string(),
    state: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_state", ["state"]),

  states: defineTable({
    name: v.string(),
    code: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  settings: defineTable({
    storeId: v.id("stores"),
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
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }),

  transactions: defineTable({
    userId: v.id("users_sync"), // Cliente que fez a compra
    storeId: v.id("stores"),
    orderId: v.id("Order"),
    amount: v.number(),
    transactionType: v.union(v.literal("SALE"), v.literal("REFUND"), v.literal("CHARGEBACK")),
    paymentMethod: v.union(v.literal("MPESA"), v.literal("EMOLA"), v.literal("MKESH"), v.literal("CREDIT_CARD")),
    transactionStatus: v.union(v.literal("PENDING"), v.literal("COMPLETED"), v.literal("FAILED"), v.literal("REFUNDED")),
    transactionDate: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_store", ["storeId"]).index("by_order", ["orderId"]),

  // ===============================

  invoices: defineTable({
    userId: v.id("users_sync"), // Cliente que fez a compra
    storeId: v.id("stores"),
    orderId: v.id("Order"),
    invoiceNumber: v.string(),
    billingAddressId: v.id("Address"),
    amount: v.number(),
    taxAmount: v.number(),
    issuedDate: v.string(),
    dueDate: v.string(),
    status: v.union(v.literal("PAID"), v.literal("UNPAID"), v.literal("OVERDUE")),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_store", ["storeId"]).index("by_order", ["orderId"]).index("by_status", ["status"]),

  // ===============================
  // WISHLIST
  // ===============================
  Wishlist: defineTable({
    userId: v.id("users_sync"),
    productId: v.id("Product"),
    createdAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_product", ["userId", "productId"]),
})

export default schema
