// Migrated from src/lib/admin.functions.ts (getAdminStats).
// NOTE: the original server function never checked for an admin role (or any
// authenticated user at all) — that gap is intentionally preserved here as-is,
// per explicit instruction. Do not add an auth/role check without confirming
// with the project owner first.
// Deploy with: supabase functions deploy get-admin-stats
import { z } from "npm:zod@3";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { createAdminClient } from "../_shared/auth.ts";

const bodySchema = z.object({
  period: z.enum(["today", "7d", "30d", "90d", "all"]).default("all"),
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

  let dateFilter = new Date();
  if (data.period === "today") dateFilter.setHours(0, 0, 0, 0);
  else if (data.period === "7d") dateFilter.setDate(dateFilter.getDate() - 7);
  else if (data.period === "30d") dateFilter.setDate(dateFilter.getDate() - 30);
  else if (data.period === "90d") dateFilter.setDate(dateFilter.getDate() - 90);
  else dateFilter = new Date(0);

  const isoDate = dateFilter.toISOString();

  const [users, activeUsers, cards, results, revenue, prizes, deposits] = await Promise.all([
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabaseAdmin.from("scratch_cards").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabaseAdmin.from("scratch_card_results").select("*", { count: "exact", head: true }).gt("created_at", isoDate),
    supabaseAdmin
      .from("wallet_transactions")
      .select("amount")
      .eq("type", "SCRATCH_PURCHASE")
      .eq("status", "COMPLETED")
      .gt("created_at", isoDate),
    supabaseAdmin
      .from("wallet_transactions")
      .select("amount")
      .eq("type", "SCRATCH_PRIZE")
      .eq("status", "COMPLETED")
      .gt("created_at", isoDate),
    supabaseAdmin.from("deposits").select("amount").eq("status", "PAID").gt("created_at", isoDate),
  ]);

  const sum = (rows: { amount: unknown }[] | null) =>
    (rows || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  const payload = {
    totalUsers: users.count || 0,
    activeUsers: activeUsers.count || 0,
    activeCards: cards.count || 0,
    totalPlays: results.count || 0,
    totalRevenue: sum(revenue.data),
    totalPrizes: sum(prizes.data),
    totalDeposited: sum(deposits.data),
    balanceMovement: sum(deposits.data) - sum(prizes.data),
  };

  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
