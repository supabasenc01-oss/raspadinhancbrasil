// Migrated from src/lib/admin.functions.ts (deleteBanner).
// Unlike the other admin functions, the original used `requireSupabaseAuth`
// middleware (real auth check) — preserved here via getAuthenticatedUser.
// Deploy with: supabase functions deploy delete-banner
import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient, getAuthenticatedUser } from "../_shared/auth.ts";

const bodySchema = z.object({ id: z.string() });

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

  const { data: current } = await supabaseAdmin.from("banners").select("*").eq("id", data.id).single();

  const { error } = await supabaseAdmin.from("banners").delete().eq("id", data.id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabaseAdmin.from("admin_logs").insert({
    action: "DELETE_BANNER",
    entity: "banners",
    actor_id: user.id,
    old_data: current,
    severity: "WARNING",
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
