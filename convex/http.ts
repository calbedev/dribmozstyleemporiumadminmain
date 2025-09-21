// convex/http.ts
import { httpRouter } from "convex/server";
import { completePayment } from "./payments";
import { webhookHandler } from "./webhookHandler";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Define um handler comum para as solicitações preflight OPTIONS
const handleOptions = httpAction(async (_, request) => {
  // Responde com os cabeçalhos CORS necessários
  return new Response(null, {
    status: 204, // No Content
    headers: {
      "Access-Control-Allow-Origin": "*", // Para produção, use a URL do seu frontend
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400", // Cache do preflight por 1 dia
    },
  });
});

// Rota para o pagamento
http.route({
  path: "/completepayment",
  method: "POST",
  handler: completePayment,
});
// Rota OPTIONS para a mesma rota de pagamento
http.route({
  path: "/completepayment",
  method: "OPTIONS",
  handler: handleOptions,
});

// Rota para o webhook
http.route({
  path: "/process-stackframe",
  method: "POST",
  handler: webhookHandler,
});
// Rota OPTIONS para a mesma rota de webhook
http.route({
  path: "/process-stackframe",
  method: "OPTIONS",
  handler: handleOptions,
});

export default http;