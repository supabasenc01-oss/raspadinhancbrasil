import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, DollarSign, Ticket, Users, ArrowUpRight } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { callEdgeFunction } from "@/lib/edge-functions";
import { formatCurrency } from "@/lib/format";

type AdminStats = {
  totalUsers: number;
  activeUsers: number;
  activeCards: number;
  totalPlays: number;
  totalRevenue: number;
  totalPrizes: number;
  totalDeposited: number;
  balanceMovement: number;
};

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Painel RaspaPremium" },
      { name: "description", content: "Módulo administrativo de Relatórios da plataforma." },
    ],
  }),
  component: AdminReportsPage,
});

function AdminReportsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats', 'all'],
    queryFn: () => callEdgeFunction<AdminStats>('get-admin-stats', { period: 'all' })
  });

  return (
    <AdminShell 
      title="Relatórios & Performance" 
      description="Visão detalhada do crescimento e saúde financeira da plataforma."
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ReportCard 
            title="Receita Bruta" 
            value={formatCurrency(stats?.totalRevenue ?? 0)} 
            icon={DollarSign}
            color="text-green-500"
          />
          <ReportCard 
            title="Prêmios Pagos" 
            value={formatCurrency(stats?.totalPrizes ?? 0)} 
            icon={TrendingUp}
            color="text-yellow-500"
          />
          <ReportCard 
            title="Total Jogadas" 
            value={stats?.totalPlays ?? 0} 
            icon={Ticket}
            color="text-primary"
          />
          <ReportCard 
            title="Novos Usuários" 
            value={stats?.totalUsers ?? 0} 
            icon={Users}
            color="text-blue-500"
          />
        </div>

        <Card className="bg-surface border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" /> Balanço Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-xl text-muted-foreground">
              [Gráfico de evolução financeira em breve]
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}

function ReportCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="bg-surface border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg bg-muted ${color}`}>
            <Icon className="size-5" />
          </div>
          <ArrowUpRight className="size-4 text-muted-foreground opacity-50" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-black">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
