import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Ticket, 
  Trophy, 
  Activity, 
  ArrowUpRight, 
  Settings, 
  FileText, 
  CreditCard, 
  PlusCircle,
  AlertCircle,
  Zap
} from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/format';

export const Route = createFileRoute('/_authenticated/admin/dashboard')({
  component: AdminDashboard,
});

async function fetchAdminStats() {
  const [users, cards, results, winners] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('scratch_cards').select('*', { count: 'exact', head: true }),
    supabase.from('scratch_card_results').select('*', { count: 'exact', head: true }),
    supabase.from('winners').select('amount.sum()')
  ]);

  return {
    usersCount: users.count || 0,
    cardsCount: cards.count || 0,
    resultsCount: results.count || 0,
    totalPrizes: (winners.data as any)?.[0]?.sum || 0
  };
}

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: fetchAdminStats
  });

  const cards = [
    { 
      label: 'Usuários Totais', 
      value: stats?.usersCount ?? 0, 
      icon: Users, 
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    { 
      label: 'Raspadinhas Ativas', 
      value: stats?.cardsCount ?? 0, 
      icon: Ticket, 
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    { 
      label: 'Jogadas Realizadas', 
      value: stats?.resultsCount ?? 0, 
      icon: Activity, 
      color: 'text-accent',
      bg: 'bg-accent/10'
    },
    { 
      label: 'Prêmios Distribuídos', 
      value: formatCurrency(stats?.totalPrizes ?? 0), 
      icon: Trophy, 
      color: 'text-success',
      bg: 'bg-success/10'
    }
  ];

  const quickActions = [
    { label: 'Nova Raspadinha', icon: PlusCircle, href: '/admin/raspadinhas/novo' },
    { label: 'Configurações', icon: Settings, href: '/admin/settings' },
    { label: 'Logs do Sistema', icon: FileText, href: '/admin/logs' },
    { label: 'Financeiro', icon: CreditCard, href: '/admin/financeiro' }
  ];

  return (
    <AdminShell>
      <div className="space-y-10">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight">DASHBOARD <span className="text-primary">ADMIN</span></h1>
          <p className="text-muted-foreground mt-1">Visão geral da plataforma e estatísticas em tempo real.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <div key={i} className="surface-card p-6 border border-border/50 relative overflow-hidden group">
              <div className={`size-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center mb-4`}>
                <card.icon className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-black">{isLoading ? '...' : card.value}</p>
              </div>
              <ArrowUpRight className="absolute top-4 right-4 size-4 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Zap className="size-4 text-primary" /> Ações Rápidas
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, i) => (
                <Link 
                  key={i} 
                  to={action.href}
                  className="surface-card p-4 flex flex-col items-center justify-center text-center gap-3 hover:border-primary/30 transition-colors"
                >
                  <action.icon className="size-6 text-muted-foreground" />
                  <span className="text-xs font-bold">{action.label}</span>
                </Link>
              ))}
            </div>
            
            <div className="p-4 rounded-2xl bg-warning/5 border border-warning/10 flex gap-3">
              <AlertCircle className="size-5 text-warning flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-warning">Atenção</p>
                <p className="text-xs text-muted-foreground">Existem 3 prêmios com estoque baixo.</p>
              </div>
            </div>
          </div>

          {/* Activity Feed Placeholder */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity className="size-4 text-accent" /> Atividade Recente
            </h3>
            <div className="surface-card overflow-hidden">
              <div className="divide-y divide-border/50">
                {[1, 2, 3, 4, 5].map((_, i) => (
                  <div key={i} className="p-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="size-2 rounded-full bg-primary" />
                      <span>Novo usuário registrado: <span className="font-bold">Ana P.***</span></span>
                    </div>
                    <span className="text-xs text-muted-foreground">Há {i * 10} min</span>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-muted/30 text-center">
                <Button variant="ghost" size="sm" className="text-xs">Ver todas as atividades</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
