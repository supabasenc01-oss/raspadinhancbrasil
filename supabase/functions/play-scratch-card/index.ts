// Migrated from src/lib/game.functions.ts (playScratchCard).
// Draws a scratch card result server-side so the outcome can't be
// manipulated by the client. Deploy with:
//   supabase functions deploy play-scratch-card
import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient, getAuthenticatedUser } from "../_shared/auth.ts";

const bodySchema = z.object({
  cardId: z.string().uuid(),
});

Deno.serve(async (request: Request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseAdmin = createAdminClient();
  const user = await getAuthenticatedUser(request, supabaseAdmin);
  if (!user) {
    return new Response(JSON.stringify({ error: "Não autorizado" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await request.json());
  } catch {
    return new Response(JSON.stringify({ error: "Dados inválidos" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // RPC draw_scratch_card already uses FOR UPDATE and transactions, and
  // checks the wallet balance before drawing (unless it's a free play).
  const { data: result, error } = await supabaseAdmin.rpc("draw_scratch_card", {
    _user_id: user.id,
    _card_id: data.cardId,
  });

  if (error) {
    console.error("Game Draw Error:", error);
    const message = error.message?.includes("Insufficient funds")
      ? "Saldo insuficiente na carteira."
      : error.message || "Falha ao processar a jogada";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
