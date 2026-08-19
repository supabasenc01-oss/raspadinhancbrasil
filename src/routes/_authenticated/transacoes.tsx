import { createFileRoute, Link } from '@tanstack/react-router'
import { PublicPage } from '@/components/layout/PublicPage'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { formatCurrency, formatDate } from '@/lib/format'
import { ArrowUpCircle, ArrowDownCircle, Trophy, CreditCard, Clock, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'


export const Route = createFileRoute('/_authenticated/transacoes')({
  component: TransacoesPage
})

function TransacoesPage() {
  const { user } = useAuth()
  
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['wallet-transactions-full', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id,
  })
  
  return (
    <PublicPage>
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Link to="/carteira" className="flex items-center gap-2 text-primary text-sm font-bold mb-6 hover:opacity-80 transition-opacity">
          <ArrowLeft className="size-4" /> VOLTAR PARA CARTEIRA
        </Link>
        
        <h1 className="text-3xl font-black uppercase tracking-tight mb-8">Histórico de Transações</h1>
        
        <div className="surface-card overflow-hidden">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 rounded-xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="divide-y divide-border/50">
              {transactions.map((tx) => (
                <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`size-12 rounded-2xl flex items-center justify-center ${
                      tx.amount > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {tx.type === 'DEPOSIT' ? <ArrowUpCircle className="size-6" /> : 
                       tx.type === 'PRIZE' ? <Trophy className="size-6" /> :
                       tx.type === 'WITHDRAW' ? <ArrowDownCircle className="size-6" /> :
                       <CreditCard className="size-6" />}
                    </div>
                    <div>
                      <div className="font-black text-sm uppercase tracking-tight">
                        {tx.description || tx.type}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase">
                          <Clock className="size-3" /> {formatDate(tx.created_at)}
                        </span>
                        <Badge variant="outline" className="text-[9px] h-4 py-0 px-1 border-border/50 text-muted-foreground">
                          {tx.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className={`text-lg font-black ${tx.amount > 0 ? 'text-green-500' : 'text-white'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              Nenhuma transação encontrada.
            </div>
          )}
        </div>
      </div>
    </PublicPage>
  )
}
