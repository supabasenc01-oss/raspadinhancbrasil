import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


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
      (supabaseAdmin.from as any)('scratch_card_results').select('*', { count: 'exact', head: true }).gt('created_at', isoDate),
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

export const updateWithdrawalStatus = createServerFn({ method: "POST" })
  .validator((data: any) => z.object({
    id: z.string(),
    status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
    admin_notes: z.string().optional()
  }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from('withdrawals')
      .update({ 
        status: data.status,
        admin_notes: data.admin_notes || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id);
    
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const upsertBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    id: z.string().optional(),
    title: z.string().min(1, "Título é obrigatório"),
    subtitle: z.string().optional(),
    image_url: z.string().min(1, "Imagem é obrigatória"),
    link_url: z.string().optional(),
    position: z.string().default("HOME_HERO"),
    sort_order: z.number().default(0),
    is_active: z.boolean().default(true),
    starts_at: z.string().nullable().optional(),
    ends_at: z.string().nullable().optional(),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;
    
    const bannerData = {
      title: data.title,
      subtitle: data.subtitle || null,
      image_url: data.image_url,
      link_url: data.link_url || null,
      position: data.position,
      sort_order: data.sort_order,
      is_active: data.is_active,
      starts_at: data.starts_at || null,
      ends_at: data.ends_at || null,
      updated_at: new Date().toISOString()
    };

    let result;
    let oldData = null;
    let action = 'CREATE_BANNER';

    if (data.id) {
      action = 'UPDATE_BANNER';
      const { data: current } = await supabaseAdmin
        .from('banners')
        .select('*')
        .eq('id', data.id)
        .single();
      oldData = current;

      result = await supabaseAdmin
        .from('banners')
        .update(bannerData)
        .eq('id', data.id);
    } else {
      result = await supabaseAdmin
        .from('banners')
        .insert(bannerData);
    }

    if (result.error) throw new Error(result.error.message);

    // Record Audit Log
    await (supabaseAdmin.from('admin_logs').insert as any)({
      action,
      entity: 'banners',
      actor_id: userId,
      old_data: oldData,
      new_data: bannerData,
      severity: 'INFO'
    });

    return { success: true };
  });


export const deleteBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => z.object({
    id: z.string()
  }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: current } = await supabaseAdmin
      .from('banners')
      .select('*')
      .eq('id', data.id)
      .single();

    const { error } = await supabaseAdmin
      .from('banners')
      .delete()
      .eq('id', data.id);
    
    if (error) throw new Error(error.message);

    // Record Audit Log
    await (supabaseAdmin.from('admin_logs').insert as any)({
      action: 'DELETE_BANNER',
      entity: 'banners',
      actor_id: userId,
      old_data: current,
      severity: 'WARNING'
    });

    return { success: true };
  });

