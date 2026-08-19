// Migrated from src/lib/admin.functions.ts (upsertBanner).
// Unlike the other admin functions, the original used `requireSupabaseAuth`
// middleware (real auth check) — preserved here via getAuthenticatedUser.
// Deploy with: supabase functions deploy upsert-banner
import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient, getAuthenticatedUser } from "../_shared/auth.ts";

const bodySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Título é obrigatório"),
  subtitle: z.string().optional(),
  image_url: z.string().min(1, "Imagem é obrigatória"),
  thumbnail_url: z.string().optional().nullable(),
  link_url: z.string().optional(),
  position: z.string().default("HOME_HERO"),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
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

  const bannerData = {
    title: data.title,
    subtitle: data.subtitle || null,
    image_url: data.image_url,
    thumbnail_url: data.thumbnail_url || null,
    link_url: data.link_url || null,
    position: data.position,
    sort_order: data.sort_order,
    is_active: data.is_active,
    starts_at: data.starts_at || null,
    ends_at: data.ends_at || null,
    updated_at: new Date().toISOString(),
  };

  let result;
  let oldData = null;
  let action = "CREATE_BANNER";

  if (data.id) {
    action = "UPDATE_BANNER";
    const { data: current } = await supabaseAdmin.from("banners").select("*").eq("id", data.id).single();
    oldData = current;
    result = await supabaseAdmin.from("banners").update(bannerData).eq("id", data.id);
  } else {
    result = await supabaseAdmin.from("banners").insert(bannerData);
  }

  if (result.error) {
    return new Response(JSON.stringify({ error: result.error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabaseAdmin.from("admin_logs").insert({
    action,
    entity: "banners",
    actor_id: user.id,
    old_data: oldData,
    new_data: bannerData,
    severity: "INFO",
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
