import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();

    // Create default store
    const storeId = await ctx.db.insert("stores", {
      name: "DribMoz",
      slug: "dribmoz",
      description: "Sua loja de moda online com as melhores marcas e tendências",
      email: "contato@dribmoz.co.mz",
      phone: "+258 84 123 4567",
      address: "Maputo, Moçambique",
      status: "active",
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
    });

    // Create main categories
    const categories = [
      {
        name: "Moda Feminina",
        slug: "moda-feminina",
        description: "Roupas e acessórios para mulheres",
        image: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg",
        sortOrder: 1,
      },
      {
        name: "Moda Masculina", 
        slug: "moda-masculina",
        description: "Roupas e acessórios para homens",
        image: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg",
        sortOrder: 2,
      },
      {
        name: "Calçados",
        slug: "calcados", 
        description: "Sapatos, tênis e sandálias",
        image: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg",
        sortOrder: 3,
      },
      {
        name: "Acessórios",
        slug: "acessorios",
        description: "Bolsas, relógios e joias",
        image: "https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg",
        sortOrder: 4,
      },
    ];

    const categoryIds = [];
    for (const category of categories) {
      const categoryId = await ctx.db.insert("Category", {
        ...category,
        isActive: true,
      });
      categoryIds.push(categoryId);
    }

    // Create brands
    const brands = [
      { name: "Nike", slug: "nike", description: "Just Do It" },
      { name: "Adidas", slug: "adidas", description: "Impossible is Nothing" },
      { name: "Zara", slug: "zara", description: "Fashion Forward" },
      { name: "H&M", slug: "hm", description: "Fashion and Quality" },
      { name: "Puma", slug: "puma", description: "Forever Faster" },
    ];

    const brandIds = [];
    for (const brand of brands) {
      const brandId = await ctx.db.insert("Brand", {
        ...brand,
        isActive: true,
      });
      brandIds.push(brandId);
    }

    // Create colors
    const colors = [
      { name: "Preto", hexCode: "#000000" },
      { name: "Branco", hexCode: "#FFFFFF" },
      { name: "Azul", hexCode: "#0066CC" },
      { name: "Vermelho", hexCode: "#CC0000" },
      { name: "Verde", hexCode: "#00CC66" },
      { name: "Rosa", hexCode: "#FF69B4" },
    ];

    for (const color of colors) {
      await ctx.db.insert("Color", {
        ...color,
        isActive: true,
      });
    }

    // Create sizes
    const sizes = [
      { name: "XS", category: "clothing", sortOrder: 1 },
      { name: "S", category: "clothing", sortOrder: 2 },
      { name: "M", category: "clothing", sortOrder: 3 },
      { name: "L", category: "clothing", sortOrder: 4 },
      { name: "XL", category: "clothing", sortOrder: 5 },
      { name: "XXL", category: "clothing", sortOrder: 6 },
      { name: "35", category: "shoes", sortOrder: 1 },
      { name: "36", category: "shoes", sortOrder: 2 },
      { name: "37", category: "shoes", sortOrder: 3 },
      { name: "38", category: "shoes", sortOrder: 4 },
      { name: "39", category: "shoes", sortOrder: 5 },
      { name: "40", category: "shoes", sortOrder: 6 },
      { name: "41", category: "shoes", sortOrder: 7 },
      { name: "42", category: "shoes", sortOrder: 8 },
      { name: "43", category: "shoes", sortOrder: 9 },
      { name: "44", category: "shoes", sortOrder: 10 },
    ];

    for (const size of sizes) {
      await ctx.db.insert("Size", {
        ...size,
        isActive: true,
      });
    }

    // Create neighborhoods
    const neighborhoods = [
      { name: "Polana", city: "Maputo", province: "Maputo", shippingCost: 0 },
      { name: "Sommerschield", city: "Maputo", province: "Maputo", shippingCost: 0 },
      { name: "Alto Maé", city: "Maputo", province: "Maputo", shippingCost: 25 },
      { name: "Baixa", city: "Maputo", province: "Maputo", shippingCost: 0 },
      { name: "Costa do Sol", city: "Maputo", province: "Maputo", shippingCost: 50 },
      { name: "Matola", city: "Matola", province: "Maputo", shippingCost: 75 },
      { name: "Beira", city: "Beira", province: "Sofala", shippingCost: 150 },
      { name: "Nampula", city: "Nampula", province: "Nampula", shippingCost: 200 },
    ];

    for (const neighborhood of neighborhoods) {
      await ctx.db.insert("Neighborhood", {
        ...neighborhood,
        isActive: true,
      });
    }

    // Create sample products
    const products = [
      {
        name: "Vestido Floral Elegante",
        slug: "vestido-floral-elegante",
        description: "Vestido feminino com estampa floral delicada, perfeito para ocasiões especiais. Tecido leve e confortável.",
        shortDesc: "Vestido floral elegante e confortável",
        price: 850,
        originalPrice: 1200,
        images: [
          "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg",
          "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg"
        ],
        thumbnail: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg",
        categoryId: categoryIds[0],
        brandId: brandIds[2],
        stockCount: 25,
        minStock: 5,
        isFeatured: true,
      },
      {
        name: "Camisa Social Masculina",
        slug: "camisa-social-masculina",
        description: "Camisa social masculina de alta qualidade, ideal para trabalho e eventos formais. Corte moderno e tecido premium.",
        shortDesc: "Camisa social premium masculina",
        price: 450,
        originalPrice: 600,
        images: [
          "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg"
        ],
        thumbnail: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg",
        categoryId: categoryIds[1],
        brandId: brandIds[2],
        stockCount: 30,
        minStock: 5,
        isFeatured: true,
      },
      {
        name: "Tênis Esportivo Nike",
        slug: "tenis-esportivo-nike",
        description: "Tênis esportivo Nike com tecnologia de amortecimento avançada. Ideal para corrida e atividades físicas.",
        shortDesc: "Tênis esportivo com amortecimento",
        price: 1200,
        originalPrice: 1500,
        images: [
          "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg"
        ],
        thumbnail: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg",
        categoryId: categoryIds[2],
        brandId: brandIds[0],
        stockCount: 15,
        minStock: 3,
        isFeatured: true,
      },
      {
        name: "Bolsa de Couro Premium",
        slug: "bolsa-couro-premium",
        description: "Bolsa feminina de couro genuíno com acabamento premium. Design elegante e funcional para o dia a dia.",
        shortDesc: "Bolsa de couro genuíno",
        price: 950,
        images: [
          "https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg"
        ],
        thumbnail: "https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg",
        categoryId: categoryIds[3],
        brandId: brandIds[2],
        stockCount: 20,
        minStock: 5,
        isFeatured: true,
      },
      {
        name: "Jeans Skinny Feminino",
        slug: "jeans-skinny-feminino",
        description: "Calça jeans skinny feminina com elastano para maior conforto. Modelagem que valoriza a silhueta.",
        shortDesc: "Jeans skinny confortável",
        price: 320,
        originalPrice: 450,
        images: [
          "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg"
        ],
        thumbnail: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg",
        categoryId: categoryIds[0],
        brandId: brandIds[3],
        stockCount: 40,
        minStock: 8,
        isFeatured: false,
      },
      {
        name: "Camiseta Básica Masculina",
        slug: "camiseta-basica-masculina",
        description: "Camiseta básica masculina 100% algodão. Peça essencial para o guarda-roupa masculino.",
        shortDesc: "Camiseta básica 100% algodão",
        price: 85,
        images: [
          "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg"
        ],
        thumbnail: "https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg",
        categoryId: categoryIds[1],
        brandId: brandIds[3],
        stockCount: 50,
        minStock: 10,
        isFeatured: false,
      },
    ];

    for (const product of products) {
      await ctx.db.insert("Product", {
        ...product,
        storeId,
        avgRating: Math.random() * 2 + 3, // Random rating between 3-5
        reviewCount: Math.floor(Math.random() * 50) + 5,
        isNew: Math.random() > 0.7,
        isPublished: true,
        inStock: true,
        soldCount: Math.floor(Math.random() * 100) + 10,
        createdAt: now,
        updatedAt: now,
        publishedAt: now,
      });
    }

    // Create slides
    const slides = [
      {
        title: "Nova Coleção Verão",
        subtitle: "Até 50% OFF",
        description: "Descubra as últimas tendências da moda verão com descontos imperdíveis",
        image: "https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg",
        cta: "Comprar Agora",
        href: "/categoria/moda-feminina",
        sortOrder: 1,
      },
      {
        title: "Calçados Esportivos",
        subtitle: "Frete Grátis",
        description: "Tênis das melhores marcas com frete grátis para todo Moçambique",
        image: "https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg",
        cta: "Ver Coleção",
        href: "/categoria/calcados",
        sortOrder: 2,
      },
      {
        title: "Acessórios Premium",
        subtitle: "Novidades",
        description: "Bolsas, relógios e joias das melhores marcas internacionais",
        image: "https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg",
        cta: "Explorar",
        href: "/categoria/acessorios",
        sortOrder: 3,
      },
    ];

    for (const slide of slides) {
      await ctx.db.insert("Slide", {
        ...slide,
        storeId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Create default user
    const defaultUserId = await ctx.db.insert("users_sync", {
      userId: "kx7fgx4t3mkkrq29wsp0sj7dd97pmkkc",
      name: "João Silva",
      email: "joao.silva@email.com",
      raw_json: {},
      created_at: now,
      updated_at: now,
    });

    return { 
      success: true, 
      storeId, 
      categoriesCreated: categoryIds.length,
      brandsCreated: brandIds.length,
      productsCreated: products.length,
      slidesCreated: slides.length,
      defaultUserId,
    };
  },
});