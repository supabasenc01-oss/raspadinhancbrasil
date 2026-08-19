// Migrated from src/lib/admin.functions.ts (getAdminUsers).
// NOTE: preserves the original's lack of an admin-role/auth check (see
// get-admin-stats for details) — not adding one here without confirmation.
// Deploy with: supabase functions deploy get-admin-users
import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/auth.ts";

const bodySchema = z.object({
  page: z.number().default(1),
  search: z.string().optional(),
});

Deno.serve(async (request: Request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await request.json().catch(() => ({})));
  } catch {
    return new Response(JSON.stringify({ error: "Dados inválidos" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createAdminClient();

  let query = supabaseAdmin
    .from("profiles")
    .select("*, wallets!wallets_user_id_fkey(balance)", { count: "exact" });

  if (data.search) {
    query = query.or(`full_name.ilike.%${data.search}%,email.ilike.%${data.search}%`);
  }

  const { data: users, count, error } = await query
    .range((data.page - 1) * 20, data.page * 20 - 1)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ users, count }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
