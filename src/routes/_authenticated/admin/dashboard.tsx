import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
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
  Zap,
  DollarSign,
  TrendingUp,
  Filter
} from 'lucide-react';

import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { getAdminStats } from '@/lib/admin.functions';
import { useServerFn } from '@tanstack/react-start';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Route = createFileRoute('/_authenticated/admin/dashboard')({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('all');
  const fetchStats = useServerFn(getAdminStats);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats', period],
    queryFn: () => fetchStats({ data: { period } })
  });

  const cards = [
    { 
      label: 'Usuários Totais', 
      value: stats?.totalUsers ?? 0, 
      subValue: `${stats?.activeUsers ?? 0} ativos`,
      icon: Users, 
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    { 
      label: 'Raspadinhas Ativas', 
      value: stats?.activeCards ?? 0, 
      icon: Ticket, 
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    { 
      label: 'Jogadas Realizadas', 
      value: stats?.totalPlays ?? 0, 
      icon: Activity, 
      color: 'text-accent',
      bg: 'bg-accent/10'
    },
    { 
      label: 'Total Arrecadado', 
      value: formatCurrency(stats?.totalRevenue ?? 0), 
      icon: DollarSign, 
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    { 
      label: 'Prêmios Distribuídos', 
      value: formatCurrency(stats?.totalPrizes ?? 0), 
      icon: Trophy, 
      color: 'text-yellow-500',
      bg: 'bg-yellow-500/10'
    },
    { 
      label: 'Total Depositado', 
      value: formatCurrency(stats?.totalDeposited ?? 0), 
      icon: TrendingUp, 
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    }
  ];

  const quickActions = [
    { label: 'Nova Raspadinha', icon: PlusCircle, href: '/admin/raspadinhas/novo' },
    { label: 'Gerenciar Usuários', icon: Users, href: '/admin/usuarios' },
    { label: 'Transações/Financeiro', icon: CreditCard, href: '/admin/financeiro' },
    { label: 'Relatórios', icon: TrendingUp, href: '/admin/relatorios' },
    { label: 'Configurações', icon: Settings, href: '/admin/configuracoes' },
    { label: 'Logs do Sistema', icon: FileText, href: '/admin/logs' },
  ];


  return (
    <AdminShell 
      title="Dashboard" 
      actions={
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="space-y-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card, i) => (
            <div key={i} className="surface-card p-6 border border-border/50 relative overflow-hidden group">
              <div className={`size-12 rounded-2xl ${card.bg} ${card.color} flex items-center justify-center mb-4`}>
                <card.icon className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-black">{isLoading ? '...' : card.value}</p>
                {card.subValue && <p className="text-xs text-muted-foreground">{card.subValue}</p>}
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
                <p className="text-xs text-muted-foreground">O sistema está pronto para monitorar alertas de estoque.</p>
              </div>
            </div>
          </div>

          {/* Activity Feed Placeholder */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity className="size-4 text-accent" /> Gráfico de Desempenho
            </h3>
            <div className="surface-card p-8 aspect-video flex items-center justify-center border border-dashed border-border text-muted-foreground">
              [Espaço para Gráficos Recharts]
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
