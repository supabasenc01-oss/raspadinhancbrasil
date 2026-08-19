import { createFileRoute } from '@tanstack/react-router';
import { ShieldCheck, Database, CreditCard, Lock, Terminal, CheckCircle2, TrendingUp } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/admin/financeiro')({
  component: AdminFinancePage,
});

function AdminFinancePage() {
  return (
    <AdminShell title="Gestão Financeira">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FinanceStatCard 
            title="Total Depositado" 
            value="R$ 12.450,00" 
            change="+12% este mês"
            icon={Database}
          />
          <FinanceStatCard 
            title="Depósitos Pendentes" 
            value="14" 
            change="Aguardando confirmação"
            icon={Terminal}
          />
          <FinanceStatCard 
            title="Pagamentos Aprovados" 
            value="128" 
            change="Últimos 30 dias"
            icon={CheckCircle2}
            color="text-green-500"
          />
          <FinanceStatCard 
            title="Volume Diário" 
            value="R$ 850,00" 
            change="Média estável"
            icon={TrendingUp}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Deposits Table */}
          <div className="lg:col-span-2 surface-card rounded-3xl overflow-hidden border border-border/50">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-bold text-lg">Últimos Depósitos</h3>
              <Button variant="outline" size="sm">Ver Todos</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface/50 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Método</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    { user: "joao@email.com", amount: 50, method: "PIX", status: "PAID", date: "Hoje, 10:45" },
                    { user: "maria@email.com", amount: 100, method: "CARD", status: "PENDING", date: "Hoje, 09:12" },
                    { user: "pedro@email.com", amount: 20, method: "PIX", status: "PAID", date: "Ontem, 22:30" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-surface/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">{row.user}</td>
                      <td className="px-6 py-4 text-sm font-black">R$ {row.amount},00</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-md">
                          {row.method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                          row.status === 'PAID' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configurações Mercado Pago */}
          <div className="space-y-6">
            <div className="surface-card p-6 rounded-3xl border border-primary/20 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CreditCard className="size-16" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" /> Configuração API
                </h3>
                <p className="text-xs text-muted-foreground">Gerencie suas credenciais do Mercado Pago para produção e testes.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Public Key</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value="APP_USR-xxxx-xxxx-xxxx" 
                      readOnly 
                      className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-xs font-mono"
                    />
                    <Button size="icon" variant="ghost" className="size-9">
                      <Lock className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Access Token</label>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      value="••••••••••••••••••••••" 
                      readOnly 
                      className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-xs font-mono"
                    />
                    <Button size="icon" variant="ghost" className="size-9">
                      <Lock className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="space-y-1">
                    <div className="text-xs font-bold">Ambiente</div>
                    <div className="text-[10px] text-primary font-medium">MODO PRODUÇÃO ATIVO</div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => toast.info("Ambiente alterado para TESTES")}>
                    Mudar
                  </Button>
                </div>

                <Button className="w-full">SALVAR ALTERAÇÕES</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function FinanceStatCard({ title, value, change, icon: Icon, color = "text-primary" }: any) {
  return (
    <div className="surface-card p-6 rounded-3xl border border-border/50 space-y-4 hover:border-primary/30 transition-colors group">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-2xl bg-surface group-hover:scale-110 transition-transform ${color}/10`}>
          <Icon className={`size-5 ${color}`} />
        </div>
      </div>
      <div className="space-y-1">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{title}</h3>
        <div className="text-2xl font-black">{value}</div>
        <p className="text-[10px] text-muted-foreground">{change}</p>
      </div>
    </div>
  );
}
