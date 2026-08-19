// Migrated from src/lib/payments.functions.ts (getWalletBalance).
// Deploy with: supabase functions deploy get-wallet-balance
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient, getAuthenticatedUser } from "../_shared/auth.ts";

Deno.serve(async (request: Request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  const supabaseAdmin = createAdminClient();
  const user = await getAuthenticatedUser(request, supabaseAdmin);
  if (!user) {
    return new Response(JSON.stringify({ balance: 0.0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  return new Response(JSON.stringify({ balance: wallet?.balance || 0.0 }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
