// convex/payments.ts
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const completePayment = httpAction(async (ctx, request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Para produção, use a URL do seu frontend
    "Content-Type": "application/json",
  };

  const {
    cartId,
    shippingAddress,
    paymentMethod,
    phoneNumber,
    userId,
  } = await request.json();

  if (!cartId) {
    return new Response(JSON.stringify({ error: "O ID do carrinho é obrigatório" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!phoneNumber || phoneNumber.length !== 9) {
    return new Response(JSON.stringify({ error: "Número de telefone inválido" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  if (!["MPESA", "emola", "card", "transfer"].includes(paymentMethod)) {
    return new Response(JSON.stringify({ error: "Método de pagamento inválido" }), {
      status: 400,
      headers: corsHeaders,
    });
  }
  
  const cartItems = await ctx.runQuery(internal.cart.getCartItems, { cartId: cartId as Id<"Cart"> });

  if (!cartItems || cartItems.length === 0) {
    return new Response(JSON.stringify({ error: "Carrinho vazio ou inválido." }), {
        status: 400,
        headers: corsHeaders,
    });
  }

  let subtotal = 0;
  for (const item of cartItems) {
      const product = await ctx.runQuery(internal.products.get, { id: item.productId });
      if (product) {
          subtotal += product.price * item.quantity;
      }
  }

  const neighborhood = await ctx.runQuery(internal.neighborhoods.get, {id: shippingAddress.neighborhood as Id<"Neighborhood">});
  const shipping = neighborhood?.shippingCost ?? 0;
  
  const totalAmount = subtotal + shipping;
  console.log("Total Amount:", totalAmount);

  try {
    const simplifiedCartItems = cartItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
    }));
      
    // ... (sua lógica de simulação de pagamento)
    const simulatedResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        id: "pay_123456789",
        checkout_url: "https://mozpayment.co.mz/checkout/pay_123456789",
        message: "Pagamento aprovado com sucesso!",
      }),
    } as Response;

    const response = simulatedResponse;
    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Falha no pagamento: ${data?.message || "Erro desconhecido"}` }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Criar pedido após pagamento bem-sucedido
    const { orderId, orderNumber } = await ctx.runMutation(
      internal.orders.createOrderFromPayment,
      {
        userId,
        cartItems: simplifiedCartItems,
        shippingAddress,
        paymentMethod,
        shippingMethod: "STANDARD",
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        status: response.status,
        purchaseId: data.id,
        orderId,
        orderNumber,
        message: "Compra realizada com sucesso!",
        checkoutUrl: data.checkout_url,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Erro na requisição de pagamento:", error);
    return new Response(
      JSON.stringify({ error: "Erro de conexão com o serviço de pagamento." }),
      { status: 500, headers: corsHeaders }
    );
  }
});