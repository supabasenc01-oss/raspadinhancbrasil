// Shared CORS headers for edge functions called directly from the browser
// (the static SPA on stockatacarejorj.com.br). Server-to-server webhooks
// (e.g. mercadopago-webhook) don't need this.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export function handleCors(request: Request): Response | null {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
