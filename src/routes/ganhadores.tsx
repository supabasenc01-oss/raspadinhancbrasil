import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Trophy, History, Clock, Medal } from 'lucide-react';

import { PublicPage } from '@/components/layout/PublicPage';
import { formatCurrency, formatDate } from '@/lib/format';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/ganhadores')({
  component: WinnersPage,
});

async function fetchWinners() {
  const { data, error } = await supabase
    .from('winners')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  
  if (error) throw error;
  return data;
}

function WinnersPage() {
  const { data: winners, isLoading } = useQuery({
    queryKey: ['winners'],
    queryFn: fetchWinners
  });

  return (
    <PublicPage>
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex flex-col items-center text-center space-y-4 mb-16">
          <div className="size-20 bg-accent/10 rounded-full flex items-center justify-center text-accent">
            <Trophy className="size-10" />
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight">MURAL DOS <span className="text-accent">GANHADORES</span></h1>
          <p className="text-muted-foreground max-w-2xl">
            Confira quem são os felizardos que já levaram prêmios em nossa plataforma. 
            A transparência e a sorte andam juntas aqui!
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-surface animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : winners && winners.length > 0 ? (
          <div className="grid gap-4">
            {winners.map((winner) => (
              <div 
                key={winner.id} 
                className="surface-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-l-4 border-accent"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="size-12 rounded-xl bg-accent/5 flex items-center justify-center text-accent">
                    <Medal className="size-6" />
                  </div>
                  <div>
                    <div className="text-lg font-bold">{winner.display_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" /> {formatDate(winner.created_at)}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col items-center sm:items-end w-full sm:w-auto bg-accent/5 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                  <div className="text-2xl font-black text-primary">{formatCurrency(winner.amount)}</div>
                  <div className="text-xs uppercase tracking-tighter text-muted-foreground font-bold">GANHOU COM PRÊMIO REAL</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl">
            <History className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold">Nenhum ganhador registrado ainda</h3>
            <p className="text-muted-foreground mt-2">Seja você o primeiro a aparecer aqui! Escolha uma raspadinha e comece a jogar.</p>
          </div>
        )}
      </div>
    </PublicPage>
  );
}
