import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { 
  Zap, 
  ArrowRight, 
  Ticket,
  Trophy,
  Filter,
  History,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

import { PublicPage } from '@/components/layout/PublicPage';
import { Button } from '@/components/ui/button';
import { activeScratchCardsQuery } from '@/lib/queries';
import { publicWinnersQuery } from '@/lib/winners.queries';
import { ScratchCardTile } from '@/components/scratch/ScratchCardTile';
import { HomeCarousel } from '@/components/home/HomeCarousel';
import { WinnersTicker } from '@/components/home/WinnersTicker';
import { AppDownloadBanner } from '@/components/common/AppDownloadBanner';
import { TestimonialsSection } from '@/components/home/TestimonialsSection';
import { ScratchDemo } from '@/components/home/ScratchDemo';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { data: scratchCards, isLoading } = useQuery(activeScratchCardsQuery);
  const { data: winners } = useQuery(publicWinnersQuery);
  const [filter, setFilter] = useState<'ALL' | 'CASH' | 'PRODUCTS'>('ALL');

  const filteredCards = scratchCards?.filter(card => {
    if (filter === 'ALL') return true;
    if (filter === 'CASH') return card.is_free === false; // Placeholder logic
    if (filter === 'PRODUCTS') return card.badge?.toLowerCase().includes('produto') || card.name.toLowerCase().includes('cozinha');
    return true;
  });

  return (
    <PublicPage>
      <AppDownloadBanner />
      
      {/* Hero / Banner Area */}
      <HomeCarousel />

      {/* Winners Ticker */}
      <WinnersTicker winners={winners} />

      {/* Live Scratch Demo */}
      <ScratchDemo />

      {/* Featured & Categories */}
      <section className="py-20 px-4 bg-background">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-4">
              <h1 className="text-4xl font-display font-black tracking-tighter uppercase leading-none">
                EXPLORE AS <span className="text-primary">RASPADINHAS</span>
              </h1>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={filter === 'ALL' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('ALL')}
                  className="rounded-full px-6"
                >
                  TODAS
                </Button>
                <Button 
                  variant={filter === 'CASH' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('CASH')}
                  className="rounded-full px-6"
                >
                  DINHEIRO
                </Button>
                <Button 
                  variant={filter === 'PRODUCTS' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setFilter('PRODUCTS')}
                  className="rounded-full px-6"
                >
                  PRODUTOS
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Prêmios Distribuídos</div>
                <div className="text-xl font-black text-success">R$ 47.572,00</div>
              </div>
              <Button variant="ghost" className="group h-12 px-6 bg-surface/50 border border-border/50" asChild>
                <Link to="/raspadinhas">
                  Ver catálogo completo <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-3xl bg-surface animate-pulse" />
              ))}
            </div>
          ) : filteredCards && filteredCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredCards.map((card) => (
                <ScratchCardTile key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 surface-card border-dashed">
              <Ticket className="size-16 text-muted-foreground mx-auto mb-6 opacity-10" />
              <h3 className="text-2xl font-bold">Nenhuma raspadinha encontrada</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">Tente ajustar sua busca ou explore outras categorias para encontrar sua próxima chance de ganhar.</p>
              <Button variant="outline" className="mt-8" onClick={() => setFilter('ALL')}>
                MOSTRAR TODAS AS RASPADINHAS
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* How it Works (Brief) */}
      <section className="py-20 bg-primary/[0.02] border-y border-primary/5">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-black">COMO <span className="text-primary">JOGAR</span></h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { 
                icon: Ticket, 
                title: "1. Escolha", 
                desc: "Selecione uma das raspadinhas disponíveis no catálogo." 
              },
              { 
                icon: Zap, 
                title: "2. Raspe", 
                desc: "Compre seu ticket e use o mouse ou dedo para revelar o prêmio." 
              },
              { 
                icon: Trophy, 
                title: "3. Ganhe", 
                desc: "Se encontrar o prêmio, o valor é creditado instantaneamente." 
              }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-4">
                <div className="size-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                  <step.icon className="size-8" />
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Winners */}
      <section className="py-20 px-4 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="size-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Trophy className="size-5" />
            </div>
            <h2 className="text-3xl font-display font-black tracking-tight">ÚLTIMOS <span className="text-accent">GANHADORES</span></h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(winners || []).slice(0, 3).map((winner, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border/50 hover:border-accent/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-accent/5 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <History className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold">{winner.display_name || winner.winner_name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" /> {new Date(winner.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-primary">R$ {winner.amount || winner.prize_value},00</div>
                  <div className="text-[10px] uppercase tracking-tighter text-muted-foreground">{winner.prize_title}</div>
                </div>
              </div>
            ))}
            {(!winners || winners.length === 0) && (
               <p className="text-muted-foreground col-span-full text-center py-8">Ainda não há ganhadores registrados.</p>
            )}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/ganhadores">VER TODOS OS GANHADORES</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialsSection />
    </PublicPage>
  );
}
