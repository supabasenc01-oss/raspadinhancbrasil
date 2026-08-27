// Lista usuários para o painel administrativo (somente equipe/staff).
// Deploy with: supabase functions deploy get-admin-users
import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient, getAuthenticatedUser } from "../_shared/auth.ts";

const bodySchema = z.object({
  page: z.number().default(1),
  search: z.string().optional(),
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request: Request) => {
  const cors = handleCors(request);
  if (cors) return cors;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  const supabaseAdmin = createAdminClient();
  const user = await getAuthenticatedUser(request, supabaseAdmin);
  if (!user) return json({ error: "Não autorizado" }, 401);

  const { data: isStaff } = await supabaseAdmin.rpc("is_staff", { _user_id: user.id });
  if (!isStaff) return json({ error: "Acesso restrito" }, 403);

  let data: z.infer<typeof bodySchema>;
  try {
    data = bodySchema.parse(await request.json().catch(() => ({})));
  } catch {
    return json({ error: "Dados inválidos" }, 400);
  }

  let query = supabaseAdmin.from("profiles").select("*", { count: "exact" });

  if (data.search) {
    query = query.or(`full_name.ilike.%${data.search}%,email.ilike.%${data.search}%`);
  }

  const { data: users, count, error } = await query
    .range((data.page - 1) * 20, data.page * 20 - 1)
    .order("created_at", { ascending: false });

  if (error) return json({ error: error.message }, 500);

  const ids = (users ?? []).map((u: { id: string }) => u.id);

  // wallets/scratch_credits referenciam auth.users, então não há relacionamento
  // direto com profiles no PostgREST — buscamos separadamente.
  const [wallets, credits, plays] = await Promise.all([
    supabaseAdmin.from("wallets").select("user_id, balance").in("user_id", ids),
    supabaseAdmin.from("scratch_credits").select("user_id, balance").in("user_id", ids),
    supabaseAdmin.from("scratch_plays").select("user_id, result_type, prize_value").in("user_id", ids),
  ]);

  const walletMap = new Map((wallets.data ?? []).map((w: any) => [w.user_id, Number(w.balance)]));
  const creditMap = new Map((credits.data ?? []).map((c: any) => [c.user_id, Number(c.balance)]));
  const playStats = new Map<string, { plays: number; wins: number; won: number }>();
  for (const p of (plays.data ?? []) as any[]) {
    const entry = playStats.get(p.user_id) ?? { plays: 0, wins: 0, won: 0 };
    entry.plays += 1;
    if (p.result_type === "WIN") entry.wins += 1;
    entry.won += Number(p.prize_value ?? 0);
    playStats.set(p.user_id, entry);
  }

  const enriched = (users ?? []).map((u: any) => ({
    ...u,
    wallet_balance: walletMap.get(u.id) ?? 0,
    scratch_credits: creditMap.get(u.id) ?? 0,
    total_plays: playStats.get(u.id)?.plays ?? 0,
    total_wins: playStats.get(u.id)?.wins ?? 0,
    total_won: playStats.get(u.id)?.won ?? 0,
  }));

  return json({ users: enriched, count });
});
