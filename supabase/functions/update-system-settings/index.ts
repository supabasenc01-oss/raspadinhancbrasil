// Migrated from src/lib/settings.functions.ts (updateSystemSettings).
// NOTE: preserves the original's lack of an admin-role/auth check — not
// adding one here without confirmation (mirrors admin.functions.ts, see
// get-admin-stats for details).
// Deploy with: supabase functions deploy update-system-settings
import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/auth.ts";

const bodySchema = z.array(
  z.object({
    key: z.string(),
    value: z.string(),
  }),
);

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

  try {
    for (const setting of data) {
      const { error } = await supabaseAdmin
        .from("system_settings")
        .upsert(
          {
            key: setting.key,
            value: JSON.parse(setting.value),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        );

      if (error) throw error;
    }

    await supabaseAdmin.from("admin_logs").insert({
      action: "UPDATE_SETTINGS",
      entity: "system_settings",
      new_data: { keys: data.map((d) => d.key) },
      severity: "INFO",
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    await supabaseAdmin.from("admin_logs").insert({
      action: "UPDATE_SETTINGS_ERROR",
      entity: "system_settings",
      severity: "ERROR",
      new_data: { error: error.message },
      stack_trace: error.stack,
    });

    return new Response(JSON.stringify({ error: error.message || "Falha ao salvar configurações" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
