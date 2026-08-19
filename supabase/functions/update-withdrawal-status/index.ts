// Migrated from src/lib/admin.functions.ts (updateWithdrawalStatus).
// NOTE: preserves the original's lack of an admin-role/auth check (see
// get-admin-stats for details) — not adding one here without confirmation.
// Deploy with: supabase functions deploy update-withdrawal-status
import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/auth.ts";

const bodySchema = z.object({
  id: z.string(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
  admin_notes: z.string().optional(),
});

Deno.serve(async (request: Request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
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

  const supabaseAdmin = createAdminClient();

  const { error } = await supabaseAdmin
    .from("withdrawals")
    .update({
      status: data.status,
      admin_notes: data.admin_notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
