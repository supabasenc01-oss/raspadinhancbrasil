import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { 
  Zap, 
  ShieldCheck, 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  Ticket,
  Clock,
  History
} from 'lucide-react';

import { PublicPage, PageHero } from '@/components/layout/PublicPage';
import { Button } from '@/components/ui/button';
import { activeScratchCardsQuery } from '@/lib/queries';
import { ScratchCardTile } from '@/components/scratch/ScratchCardTile';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { data: scratchCards, isLoading } = useQuery(activeScratchCardsQuery);

  return (
    <PublicPage>
      {/* Hero Section */}
      <PageHero 
        title="ETAPA 3 — CARTEIRA FINANCEIRA + MERCADO PAGO CHECKOUT TRANSPARENTE"
        description="Agora implementar o sistema financeiro da plataforma."
        centered
      >

        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Button size="lg" className="bg-gradient-brand text-primary-foreground group" asChild>
            <Link to="/raspadinhas">
              VER TODAS AS RASPADINHAS 
              <Zap className="ml-2 size-4 group-hover:scale-110 transition-transform" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/como-funciona">
              SAIBA MAIS
            </Link>
          </Button>
        </div>
      </PageHero>

      {/* Stats / Features Bar */}
      <div className="border-y border-border/50 bg-surface/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="text-2xl font-black text-primary">100%</div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">SEGURO & AUDITÁVEL</div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="text-2xl font-black text-primary">INSTANTÂNEO</div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">PRÊMIOS NA HORA</div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="text-2xl font-black text-primary">+20</div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">PRÊMIOS POR JOGO</div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="text-2xl font-black text-primary">PIX</div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">PAGAMENTOS RÁPIDOS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Scratch Cards */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-black tracking-tight">
                RASPADINHAS <span className="text-primary">POPULARES</span>
              </h2>
              <p className="text-muted-foreground">Escolha a sua favorita e tente a sorte agora mesmo.</p>
            </div>
            <Button variant="ghost" className="group" asChild>
              <Link to="/raspadinhas">
                Ver todas <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-3xl bg-surface animate-pulse" />
              ))}
            </div>
          ) : scratchCards && scratchCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {scratchCards.map((card) => (
                <ScratchCardTile key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 surface-card">
              <Ticket className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium">Nenhuma raspadinha ativa no momento</h3>
              <p className="text-sm text-muted-foreground mt-1">Volte em breve para novas oportunidades.</p>
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
            {[
              { name: "João M.***", prize: "Raspadinha Gold", amount: 500, time: "2 min atrás" },
              { name: "Maria S.***", prize: "Sorte Instantânea", amount: 50, time: "5 min atrás" },
              { name: "Pedro R.***", prize: "Mega Raspa", amount: 1000, time: "12 min atrás" },
            ].map((winner, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border/50 hover:border-accent/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-accent/5 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <History className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold">{winner.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" /> {winner.time}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-primary">R$ {winner.amount},00</div>
                  <div className="text-[10px] uppercase tracking-tighter text-muted-foreground">{winner.prize}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/ganhadores">VER TODOS OS GANHADORES</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
