import { createFileRoute } from '@tanstack/react-router';
import { ShieldCheck, Database, CreditCard, Lock, Terminal, CheckCircle2, TrendingUp, Search, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemSettingsQuery } from '@/lib/queries';
import { updateSystemSettings } from '@/lib/settings.functions';
import { updateWithdrawalStatus } from '@/lib/admin.functions';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/_authenticated/admin/financeiro')({
  component: AdminFinancePage,
});

function AdminFinancePage() {
  const queryClient = useQueryClient();
  const updateSettings = useServerFn(updateSystemSettings);
  const updateWithdrawalStatusFn = useServerFn(updateWithdrawalStatus);
  const { data: settings } = useQuery(systemSettingsQuery);
  
  const [values, setValues] = useState<Record<string, string>>({});
  const [showToken, setShowToken] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(true);

  useEffect(() => {
    if (settings) {
      const newValues: Record<string, string> = {};
      settings.forEach(s => {
        try {
          const parsed = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
          newValues[s.key] = String(parsed || '');
        } catch {
          newValues[s.key] = String(s.value || '');
        }
      });
      setValues(newValues);
    }
  }, [settings]);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          profiles:user_id (email, full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error) {
        setWithdrawals(data || []);
      }
      setIsLoadingWithdrawals(false);
    };

    fetchWithdrawals();
  }, []);

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const mutation = useMutation({
    mutationFn: (data: { key: string; value: string }[]) => updateSettings({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system_settings'] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message);
    }
  });

  const handleSaveSettings = () => {
    const data = [
      { key: 'mp_public_key', value: JSON.stringify(values['mp_public_key'] || '') },
      { key: 'mp_access_token', value: JSON.stringify(values['mp_access_token'] || '') },
      { key: 'mp_environment', value: JSON.stringify(values['mp_environment'] || 'production') }
    ];
    mutation.mutate(data);
  };

  const handleWithdrawalUpdate = async (id: string, status: 'PENDING' | 'COMPLETED' | 'CANCELLED') => {
    try {
      await updateWithdrawalStatusFn({ data: { id, status } });
      toast.success("Status atualizado!");
      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status } : w));
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

  return (
    <AdminShell title="Gestão Financeira">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FinanceStatCard 
            title="Total Depositado" 
            value="R$ 0,00" 
            change="Métricas em tempo real"
            icon={Database}
          />
          <FinanceStatCard 
            title="Saques Pendentes" 
            value={withdrawals.filter(w => w.status === 'PENDING').length} 
            change="Aguardando aprovação"
            icon={Terminal}
          />
          <FinanceStatCard 
            title="Transações Hoje" 
            value="0" 
            change="Últimas 24 horas"
            icon={CheckCircle2}
            color="text-green-500"
          />
          <FinanceStatCard 
            title="Volume Diário" 
            value="R$ 0,00" 
            change="Média estável"
            icon={TrendingUp}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Withdrawals Table */}
          <div className="lg:col-span-2 surface-card rounded-3xl overflow-hidden border border-border/50">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
              <h3 className="font-bold text-lg">Solicitações de Saque</h3>
              <Button variant="outline" size="sm">Ver Todos</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface/50 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Usuário</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Método / Chave</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {isLoadingWithdrawals ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <Loader2 className="size-6 animate-spin mx-auto text-primary" />
                      </td>
                    </tr>
                  ) : withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-sm">
                        Nenhuma solicitação de saque encontrada.
                      </td>
                    </tr>
                  ) : withdrawals.map((row) => (
                    <tr key={row.id} className="hover:bg-surface/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">{row.profiles?.full_name || 'Usuário'}</div>
                        <div className="text-[10px] text-muted-foreground">{row.profiles?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-black">R$ {row.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className="text-[10px] font-bold text-primary">{row.method}</div>
                        <div className="text-xs font-mono">{row.pix_key}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                          row.status === 'COMPLETED' ? 'bg-green-500/10 text-green-500' : 
                          row.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-red-500/10 text-red-500'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {row.status === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="h-7 text-[10px] bg-green-600 hover:bg-green-700"
                              onClick={() => handleWithdrawalUpdate(row.id, 'COMPLETED')}
                            >
                              Aprovar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="h-7 text-[10px]"
                              onClick={() => updateWithdrawalStatus(row.id, 'CANCELLED')}
                            >
                              Recusar
                            </Button>
                          </div>
                        )}
                      </td>
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
                  <ShieldCheck className="size-5 text-primary" /> Mercado Pago
                </h3>
                <p className="text-xs text-muted-foreground">Credenciais para o Checkout Transparente.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Public Key</label>
                  <Input 
                    value={values['mp_public_key'] || ''}
                    onChange={(e) => handleChange('mp_public_key', e.target.value)}
                    placeholder="APP_USR-..."
                    className="bg-surface border border-border rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Access Token</label>
                  <div className="relative">
                    <Input 
                      type={showToken ? "text" : "password"}
                      value={values['mp_access_token'] || ''}
                      onChange={(e) => handleChange('mp_access_token', e.target.value)}
                      placeholder="APP_USR-..."
                      className="bg-surface border border-border rounded-xl text-xs font-mono pr-10"
                    />
                    <button 
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                    >
                      {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-primary/5 border border-primary/20">
                  <div className="space-y-1">
                    <div className="text-xs font-bold">Ambiente</div>
                    <div className="text-[10px] text-primary font-medium uppercase">
                      {values['mp_environment'] === 'sandbox' ? 'MODO TESTE (SANDBOX)' : 'MODO PRODUÇÃO'}
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleChange('mp_environment', values['mp_environment'] === 'sandbox' ? 'production' : 'sandbox')}
                  >
                    Mudar
                  </Button>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleSaveSettings}
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  SALVAR ALTERAÇÕES
                </Button>
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
