import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getAdminStats = createServerFn({ method: "GET" })
  .validator((data: any) => z.object({
    period: z.enum(['today', '7d', '30d', '90d', 'all']).default('all')
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    let dateFilter = new Date();
    if (data.period === 'today') dateFilter.setHours(0,0,0,0);
    else if (data.period === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
    else if (data.period === '30d') dateFilter.setDate(dateFilter.getDate() - 30);
    else if (data.period === '90d') dateFilter.setDate(dateFilter.getDate() - 90);
    else dateFilter = new Date(0);

    const isoDate = dateFilter.toISOString();

    const [users, activeUsers, cards, results, revenue, prizes, deposits] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabaseAdmin.from('scratch_cards').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabaseAdmin.from('scratch_card_sessions').select('*', { count: 'exact', head: true }).gt('created_at', isoDate),
      supabaseAdmin.from('wallet_transactions').select('amount').eq('type', 'SCRATCH_PURCHASE').eq('status', 'COMPLETED').gt('created_at', isoDate),
      supabaseAdmin.from('wallet_transactions').select('amount').eq('type', 'SCRATCH_PRIZE').eq('status', 'COMPLETED').gt('created_at', isoDate),
      supabaseAdmin.from('deposits').select('amount').eq('status', 'PAID').gt('created_at', isoDate)
    ]);

    const sum = (data: any[] | null) => (data || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    return {
      totalUsers: users.count || 0,
      activeUsers: activeUsers.count || 0,
      activeCards: cards.count || 0,
      totalPlays: results.count || 0,
      totalRevenue: sum(revenue.data),
      totalPrizes: sum(prizes.data),
      totalDeposited: sum(deposits.data),
      balanceMovement: sum(deposits.data) - sum(prizes.data)
    };
  });

export const getAdminUsers = createServerFn({ method: "GET" })
  .validator((data: any) => z.object({
    page: z.number().default(1),
    search: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    let query = supabaseAdmin
      .from('profiles')
      .select('*, wallets!wallets_user_id_fkey(balance)', { count: 'exact' });

    if (data.search) {
      query = query.or(`full_name.ilike.%${data.search}%,email.ilike.%${data.search}%`);
    }

    const { data: users, count, error } = await query
      .range((data.page - 1) * 20, data.page * 20 - 1)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return { users, count };
  });

export const updateScratchCardStatus = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({
    id: z.string(),
    status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED', 'ARCHIVED'])
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from('scratch_cards')
      .update({ status: data.status })
      .eq('id', data.id);
    
    if (error) throw new Error(error.message);
    return { success: true };
  });
