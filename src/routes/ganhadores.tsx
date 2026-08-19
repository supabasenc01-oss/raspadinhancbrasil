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
    .from('winners' as any)
    .select(`
      id,
      amount,
      created_at,
      prize_id,
      profiles (
        display_name
      )
    `)
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {winners.map((winner: any) => {
              const profile = winner.profiles;
              const name = profile?.display_name || 'Ganhador';
              const abbreviatedName = name.split(' ').map((n: string, i: number) => i === 0 ? n : n[0] + '.').join(' ');

              return (
                <div 
                  key={winner.id} 
                  className="surface-card p-6 flex flex-col gap-6 hover-lift relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy className="size-12" />
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-gradient-brand flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                      <Medal className="size-8" />
                    </div>
                    <div>
                      <div className="text-xl font-black">{abbreviatedName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" /> {formatDate(winner.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-3xl font-display font-black text-primary drop-shadow-sm">
                      {formatCurrency(winner.amount || 0)}
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                      PRÊMIO REAL • INSTANTÂNEO
                    </div>
                  </div>
                </div>
              );
            })}
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
