import { mutation } from "./_generated/server";
import { TableNames, Doc, Id } from "./_generated/dataModel";
import { nanoid } from "nanoid";

// ===============================================
// HELPERS
// ===============================================

// Helper para escolher um item aleatório de um array
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Helper para escolher vários itens únicos de um array
const pickRandomMultiple = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Helper para escolher um número aleatório num intervalo
const randomBetween = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper para criar uma data ISO no passado
const randomPastDateISO = () => {
  const date = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // nos últimos 90 dias
  return date.toISOString();
};

// Helper para gerar um slug a partir de um nome
const slugify = (text: string) => text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');


export default mutation({
  handler: async (ctx) => {
    console.log("=============================================");
    console.log("🚀 Iniciando o processo de seeding do banco de dados...");
    console.log("=============================================");

    // ===============================================
    // 1. LIMPEZA DO BANCO DE DADOS
    // ===============================================
    console.log("🧹 Limpando dados existentes...");

    const tablesToDelete: TableNames[] = [
      "users_sync", "stores", "team_members", "Slide", "Category", "Brand",
      "Product", "ProductVariant", "Color", "Size", "Tag", "ProductTag",
      "Review", "Cart", "CartItem", "Order", "StoreOrder", "OrderItem",
      "Address", "Neighborhood", "cities", "states", "settings"
    ];

    for (const tableName of tablesToDelete) {
      try {
        const documents = await ctx.db.query(tableName).collect();
        await Promise.all(documents.map(doc => ctx.db.delete(doc._id)));
      } catch (e) {
        console.warn(`Aviso: Não foi possível limpar a tabela '${tableName}'. Pode não existir.`)
      }
    }

    console.log("✅ Limpeza concluída.");

    // ===============================================
    // 2. SEEDING DE DADOS
    // ===============================================
    console.log("🌱 Inserindo novos dados...");

    // --- Utilizadores, Lojas, Equipas (Base) ---
    const userNames = ["João", "Maria", "Pedro", "Ana", "Sofia", "Carlos", "Marta", "Luís", "Beatriz", "Tiago", "Inês", "Rui", "Cláudia", "Miguel", "Lúcia"];
    const userIds: Id<"users_sync">[] = [];
    for (let i = 0; i < 15; i++) {
      const name = `${userNames[i]} ${pickRandom(["Silva", "Langa", "Machava", "Chissano", "Machel"])}`;
      const email = `${name.split(' ')[0].toLowerCase()}.${i}@example.com`;
      const id = await ctx.db.insert("users_sync", { userId: `user_${nanoid(8)}`, name, email, created_at: randomPastDateISO(), updated_at: new Date().toISOString(), raw_json: { "from": "seed" }});
      userIds.push(id);
    }
    console.log(`👤 ${userIds.length} utilizadores inseridos.`);

    const storeNames = ["Mercearia do Bairro", "Tech Mozambique", "Moda & Estilo MZ"];
    const storeIds: Id<"stores">[] = [];
    for (const name of storeNames) {
        const id = await ctx.db.insert("stores", { name, slug: slugify(name), description: `A melhor loja para ${name}.`, status: "active", createdAt: randomPastDateISO(), createdBy: pickRandom(userIds).toString() });
        storeIds.push(id);
    }
    console.log(`🏪 ${storeIds.length} lojas inseridas.`);

    const roles: Doc<"team_members">["role"][] = ["owner", "editor", "shipper", "viewer", "moderator"];
    await ctx.db.insert("team_members", { userId: userIds[0], email: (await ctx.db.get(userIds[0]))!.email, storeId: storeIds[0], role: "superadmin", status: "active", invitedAt: randomPastDateISO(), invitedBy: userIds[0].toString() });
    for (let i = 1; i < 10; i++) {
        await ctx.db.insert("team_members", { userId: userIds[i], email: (await ctx.db.get(userIds[i]))!.email, storeId: pickRandom(storeIds), role: pickRandom(roles), status: pickRandom(["active", "pending"]), invitedAt: randomPastDateISO(), invitedBy: userIds[0].toString() });
    }
    console.log(`👥 10 membros de equipa inseridos.`);
    
    // --- Localizações (Moçambique) ---
    const provinces = [ { name: "Maputo Cidade", code: "MPM" }, { name: "Maputo Província", code: "MAP" }, { name: "Gaza", code: "GAZ" }, { name: "Inhambane", code: "INH" }, { name: "Sofala", code: "SOF" }, { name: "Manica", code: "MAN" }, { name: "Tete", code: "TET" }, { name: "Zambézia", code: "ZAM" }, { name: "Nampula", code: "NAM" }, { name: "Cabo Delgado", code: "CD" }, { name: "Niassa", code: "NIA" }];
    for (const p of provinces) { await ctx.db.insert("states", { name: p.name, code: p.code, active: true, createdAt: Date.now(), updatedAt: Date.now() }); }
    console.log(`🇲🇿 ${provinces.length} províncias ('states') inseridas.`);
    
    const citiesByProvince: { [key: string]: string[] } = { "Maputo Cidade": ["Maputo"], "Maputo Província": ["Matola", "Boane"], "Gaza": ["Xai-Xai", "Chibuto"], "Inhambane": ["Inhambane", "Maxixe"], "Sofala": ["Beira", "Dondo"], "Manica": ["Chimoio", "Manica"], "Tete": ["Tete", "Moatize"], "Zambézia": ["Quelimane", "Mocuba"], "Nampula": ["Nampula", "Nacala"], "Cabo Delgado": ["Pemba", "Montepuez"], "Niassa": ["Lichinga", "Cuamba"] };
    for (const pName of Object.keys(citiesByProvince)) {
        for (const cName of citiesByProvince[pName]) {
            await ctx.db.insert("cities", { name: cName, state: pName, active: true, createdAt: Date.now(), updatedAt: Date.now() });
        }
    }
    console.log(`🏙️ ${Object.values(citiesByProvince).flat().length} cidades inseridas.`);

    // --- Banners (Slides) ---
    const slideIds: Id<"Slide">[] = [];
    for (let i = 0; i < 15; i++) {
      const id = await ctx.db.insert("Slide", { title: `Promoção Imperdível ${i + 1}`, subtitle: `Descontos até ${randomBetween(20, 70)}%`, description: "Aproveite as melhores ofertas da estação.", image: `/slides/banneMT{i + 1}.jpg`, cta: "Comprar Agora", href: `/deals/${i + 1}`});
      slideIds.push(id);
    }
    console.log(`🖼️ ${slideIds.length} slides inseridos.`);

    // --- Tags ---
    const tagsData = [ { name: "Promoção", color: "red" }, { name: "Novo", color: "blue" }, { name: "Mais Vendido", color: "green" }, { name: "Importado", color: "purple" }, { name: "Feito em Moçambique", color: "yellow" }, { name: "Stock Limitado", color: "orange" }, { name: "Exclusivo Online", color: "cyan" }, { name: "Sustentável", color: "lime" }, { name: "Tecnologia", color: "geekblue" }, { name: "Moda 2025", color: "magenta" }, { name: "Presente Ideal", color: "gold" }, { name: "Para Casa", color: "brown" }, { name: "Leve 3 Pague 2", color: "red" }, { name: "Queima de Stock", color: "volcano" }, { name: "Gourmet", color: "purple" } ];
    const tagIds: Id<"Tag">[] = [];
    for (const t of tagsData) {
      const id = await ctx.db.insert("Tag", { name: t.name, slug: slugify(t.name), color: t.color, isActive: true });
      tagIds.push(id);
    }
    console.log(`🏷️ ${tagIds.length} tags inseridas.`);

    // --- Cores e Tamanhos ---
    const colorsData = [ { name: "Preto", hex: "#000000" }, { name: "Branco", hex: "#FFFFFF" }, { name: "Azul Marinho", hex: "#000080" }, { name: "Vermelho", hex: "#FF0000" }, { name: "Verde Oliva", hex: "#808000" }, { name: "Cinzento", hex: "#808080" }, { name: "Bege", hex: "#F5F5DC" }];
    const colorIds = await Promise.all(colorsData.map(c => ctx.db.insert("Color", { name: c.name, hexCode: c.hex, isActive: true })));

    const sizesData = [ { n: "XS", c: "Roupa" }, { n: "S", c: "Roupa" }, { n: "M", c: "Roupa" }, { n: "L", c: "Roupa" }, { n: "XL", c: "Roupa" }, { n: "XXL", c: "Roupa" }, { n: "38", c: "Calçado" }, { n: "39", c: "Calçado" }, { n: "40", c: "Calçado" }, { n: "41", c: "Calçado" }, { n: "42", c: "Calçado" }, { n: "43", c: "Calçado" }, { n: "17", c: "Anel" }, { n: "18", c: "Anel" }, { n: "Único", c: "Acessório" } ];
    const sizeIds: Id<"Size">[] = [];
    for (let i = 0; i < sizesData.length; i++) {
        const id = await ctx.db.insert("Size", { name: sizesData[i].n, category: sizesData[i].c, sortOrder: i + 1, isActive: true });
        sizeIds.push(id);
    }
    console.log(`🎨 ${colorIds.length} cores e ${sizeIds.length} tamanhos inseridos.`);
    
    // --- Categorias e Marcas ---
    const categoryNames = ["Eletrónicos", "Moda", "Casa & Cozinha", "Livros", "Smartphones", "T-shirts", "Sapatos"];
    const categoryIds = await Promise.all(categoryNames.map((name, i) => ctx.db.insert("Category", { name, slug: slugify(name), isActive: true, sortOrder: i })));
    await ctx.db.patch(categoryIds[4], { parentId: categoryIds[0] }); // Smartphones -> Eletrónicos
    await ctx.db.patch(categoryIds[5], { parentId: categoryIds[1] }); // T-shirts -> Moda
    const brandNames = ["Samsung", "Apple", "Nike", "Adidas", "INCO", "Plural Editores"];
    const brandIds = await Promise.all(brandNames.map(name => ctx.db.insert("Brand", { name, slug: slugify(name), isActive: true })));
    console.log(`📚 ${categoryIds.length} categorias e ${brandIds.length} marcas inseridas.`);

    // --- Produtos com Variantes ---
    const productIds: Id<"Product">[] = [];
    const productVariantIds: Id<"ProductVariant">[] = [];

    for (let i = 0; i < 15; i++) {
      const price = randomBetween(500, 100000);
      const hasVariants = Math.random() > 0.4; // 60% dos produtos terão variantes
      const category = pickRandom(categoryIds);
      const categoryInfo = await ctx.db.get(category);

      const productId = await ctx.db.insert("Product", {
        storeId: pickRandom(storeIds),
        name: `Produto ${categoryInfo!.name} Exemplo ${i + 1}`,
        slug: `produto-${slugify(categoryInfo!.name)}-${i + 1}`,
        description: `Descrição detalhada para o produto de exemplo número ${i + 1}.`,
        price,
        images: [`/products/img${i}.jpg`],
        thumbnail: `/products/img${i}-thumb.jpg`,
        avgRating: +(Math.random() * 5).toFixed(1),
        reviewCount: randomBetween(0, 50),
        isNew: Math.random() > 0.7,
        isFeatured: Math.random() > 0.5,
        isPublished: true,
        inStock: true, // A ser atualizado com base nas variantes
        stockCount: 0, // A ser atualizado
        soldCount: randomBetween(10, 200),
        minStock: 10,
        categoryId: category,
        brandId: pickRandom(brandIds),
        createdAt: randomPastDateISO(),
        updatedAt: new Date().toISOString(),
      });
      productIds.push(productId);

      // Associar Tags ao Produto
      const tagsForProduct = pickRandomMultiple(tagIds, randomBetween(1, 3));
      for (const tagId of tagsForProduct) {
        await ctx.db.insert("ProductTag", { productId, tagId });
      }

      let totalStock = 0;
      if (hasVariants && (categoryInfo!.name.includes("Moda") || categoryInfo!.name.includes("T-shirt") || categoryInfo!.name.includes("Sapato"))) {
        const availableSizes = sizeIds.filter(async id => (await ctx.db.get(id))?.category === (categoryInfo!.name.includes("Sapato") ? "Calçado" : "Roupa"));
        const variantsToCreate = pickRandomMultiple(availableSizes, randomBetween(2, 4));
        
        for(const sizeId of variantsToCreate) {
            const colorId = pickRandom(colorIds);
            const stock = randomBetween(5, 50);
            totalStock += stock;
            const variantId = await ctx.db.insert("ProductVariant", {
                productId,
                colorId,
                sizeId,
                priceAdjust: 0,
                stockCount: stock,
                sku: `SKU-${productId.slice(4)}-${sizeId.slice(4)}-${colorId.slice(4)}`,
                isActive: true
            });
            productVariantIds.push(variantId);
        }
      } else {
        totalStock = randomBetween(10, 100);
      }
      
      await ctx.db.patch(productId, { stockCount: totalStock, inStock: totalStock > 0 });
    }
    console.log(`📦 ${productIds.length} produtos inseridos.`);
    console.log(`🎨 ${productVariantIds.length} variantes de produto inseridas.`);
    console.log(`🔗 Associações produto-tag inseridas.`);

    // --- Carrinhos (Carts) e Itens ---
    for (let i = 0; i < 5; i++) {
        const isUserCart = Math.random() > 0.4; // 60% são de utilizadores
        let cartId: Id<"Cart">;
        if (isUserCart) {
            cartId = await ctx.db.insert("Cart", { userId: pickRandom(userIds), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isPurshed: false });
        } else {
            cartId = await ctx.db.insert("Cart", { sessionId: nanoid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isPurshed: false });
        }

        const itemsInCart = randomBetween(1, 4);
        for(let j = 0; j < itemsInCart; j++) {
            const product = await ctx.db.get(pickRandom(productIds));
            if(!product) continue;
            
            await ctx.db.insert("CartItem", {
                cartId,
                productId: product._id,
                // Lógica para adicionar variante se existir
                variantId: (product.stockCount > 0 && productVariantIds.length > 0 && Math.random() > 0.5) ? pickRandom(productVariantIds) : undefined,
                quantity: randomBetween(1, 3),
                price: product.price,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
    }
    console.log(`🛒 5 carrinhos com itens inseridos.`);

    // --- Outros dados dependentes (Reviews, Orders, etc.) ---
    // (A lógica de Pedidos e Reviews do script anterior já é robusta e será mantida)
    
    // --- Pedidos (Orders), StoreOrders e OrderItems --- (Lógica mantida)
    const neighborhoodIds = await Promise.all(
        [{name: "Polana", city: "Maputo"}, {name: "Malhangalene", city: "Maputo"}, {name: "Baixa", city: "Beira"}]
        .map(n => ctx.db.insert("Neighborhood", { name: n.name, city: n.city, province: "Província Exemplo", shippingCost: randomBetween(100, 300), isActive: true }))
    );
    for (const user of userIds) {
        await ctx.db.insert("Address", { userId: user, block: randomBetween(1, 50), houseNumber: randomBetween(1, 500), neighborhood: pickRandom(neighborhoodIds), city: "Maputo", province: "Maputo Cidade", zipCode: "1100", isDefault: true, createdAt: randomPastDateISO(), updatedAt: new Date().toISOString() });
    }
    console.log(`🏠 Endereços para todos os utilizadores inseridos.`);

    for (let i = 0; i < 15; i++) {
        const user = await ctx.db.get(pickRandom(userIds));
        const address = await ctx.db.query("Address").filter(q => q.eq(q.field("userId"), user!._id)).first();
        if (!user || !address) continue;
        const firstProduct = await ctx.db.get(pickRandom(productIds));
        if (!firstProduct) continue;
        const storeId = firstProduct.storeId;
        const orderProducts = [firstProduct];
        const subtotal = orderProducts.reduce((sum, p) => sum + p.price, 0);
        const userOrderId = await ctx.db.insert("Order", { orderNumber: nanoid(8).toUpperCase(), userId: user._id, status: "DELIVERED", subtotal, shipping: 150, tax: 0, discount: 0, total: subtotal + 150, shippingAddressId: address._id, paymentMethod: "MPESA", paymentStatus: "PAID", createdAt: randomPastDateISO(), updatedAt: new Date().toISOString() });
        const storeOrderId = await ctx.db.insert("StoreOrder", { orderNumber: (await ctx.db.get(userOrderId))!.orderNumber, userOrder: userOrderId, userId: user._id, storeId, status: "DELIVERED", subtotal, shipping: 150, tax: 0, discount: 0, total: subtotal + 150, shippingAddressId: address._id, paymentMethod: "MPESA", paymentStatus: "PAID", createdAt: (await ctx.db.get(userOrderId))!.createdAt, updatedAt: new Date().toISOString() });
        for (const item of orderProducts) { await ctx.db.insert("OrderItem", { orderIdForUser: userOrderId, orderIdForStore: storeOrderId, productId: item._id, quantity: 1, price: item.price }); }
    }
    console.log(`🧾 15 pedidos inseridos.`);
    
    for (let i = 0; i < 15; i++) {
        const product = await ctx.db.get(pickRandom(productIds));
        if(!product) continue;
        await ctx.db.insert("Review", { rating: randomBetween(3, 5), comment: "Comentário de teste.", productId: product._id, userId: pickRandom(userIds), storeId: product.storeId, isApproved: true, isHelpful: 0, isVerifiedPurchase: true, createdAt: randomPastDateISO(), updatedAt: new Date().toISOString() });
    }
    console.log(`⭐️ 15 reviews inseridas.`);
    
    for (const storeId of storeIds) {
        const store = await ctx.db.get(storeId);
        if(!store) continue;
        await ctx.db.insert("settings", { storeId, storeName: store.name, contactEmail: `suporte@${slugify(store.name)}.co.mz`, currency: "MZN", defaultShippingFee: 250, freeShippingThreshold: 5000 });
    }
    console.log(`⚙️ ${storeIds.length} registos de configurações inseridos.`);

    console.log("=============================================");
    console.log("✅ Processo de seeding concluído com sucesso!");
    console.log("=============================================");
  },
});
