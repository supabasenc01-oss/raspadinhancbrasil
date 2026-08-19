import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { 
  Wallet, 
  ArrowUpCircle, 
  History, 
  Plus, 
  CreditCard, 
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';
import { useServerFn } from '@tanstack/react-start';
import { getWalletBalance } from '@/lib/payments.functions';

export const Route = createFileRoute('/_authenticated/carteira')({
  component: WalletPage,
});

function WalletPage() {
  const { user } = useAuth();
  const fetchBalance = useServerFn(getWalletBalance);
  
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['wallet-balance', user?.id],
    queryFn: () => fetchBalance({}),
    enabled: !!user?.id,
  });

  // Query para transações recentes
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['wallet-transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header com Saldo */}
      <div className="surface-card p-8 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
          <Wallet className="size-32" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-1">
            <h1 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Saldo Disponível</h1>
            <div className="text-4xl md:text-5xl font-black text-primary font-display">
              {isLoadingBalance ? "R$ ---" : formatCurrency(balanceData?.balance || 0)}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-gradient-brand text-primary-foreground shadow-lg shadow-primary/20" asChild>
              <Link to="/_authenticated/carteira/adicionar">
                <Plus className="mr-2 size-5" /> ADICIONAR SALDO
              </Link>
            </Button>
            <Button size="lg" variant="outline">
              <History className="mr-2 size-5" /> VER EXTRATO COMPLETO
            </Button>
          </div>
        </div>
      </div>

      {/* Grid de Informações */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Atividade Recente */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Clock className="size-5 text-primary" /> Atividade Recente
            </h2>
          </div>

          <div className="space-y-3">
            {isLoadingTransactions ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse" />
              ))
            ) : transactions && transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="p-4 rounded-2xl bg-surface/50 border border-border/50 flex items-center justify-between hover:bg-surface transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${
                      tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.type === 'DEPOSIT' ? <ArrowUpCircle className="size-5" /> : 
                       tx.type === 'PRIZE' ? <Trophy className="size-5" /> :
                       <CreditCard className="size-5" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{tx.description || tx.type}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {new Date(tx.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className={`font-black ${tx.amount > 0 ? 'text-green-500' : 'text-white'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 surface-card border-dashed">
                <AlertCircle className="size-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground">Nenhuma transação encontrada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Estatísticas / Banners */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-surface/30 border border-primary/10 space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 text-primary/10">
              <TrendingUp className="size-16" />
            </div>
            <h3 className="text-lg font-bold">Resumo Financeiro</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Ganhos</span>
                <div className="text-lg font-bold text-green-500">R$ 0,00</div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Jogados</span>
                <div className="text-lg font-bold text-primary">R$ 0,00</div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-brand text-primary-foreground space-y-3 shadow-xl shadow-primary/10">
            <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Trophy className="size-6" />
            </div>
            <h3 className="font-bold">Indique e Ganhe!</h3>
            <p className="text-sm opacity-90">Ganhe bônus em cada depósito dos seus amigos indicados.</p>
            <Button variant="secondary" size="sm" className="w-full">VER PROGRAMA</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
