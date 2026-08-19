import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { 
  Ticket, 
  Search, 
  Filter, 
  Sparkles, 
  Zap,
  LayoutGrid,
  Loader2
} from 'lucide-react';
import { useState } from 'react';

import { PublicPage } from '@/components/layout/PublicPage';
import { activeScratchCardsQuery } from '@/lib/queries';
import { ScratchCardTile } from '@/components/scratch/ScratchCardTile';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/raspadinhas')({
  component: ScratchCardsCatalogPage,
});

function ScratchCardsCatalogPage() {
  const { data: cards, isLoading } = useQuery(activeScratchCardsQuery);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCards = cards?.filter(card => 
    card.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PublicPage>
      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider">
              <Sparkles className="size-3" /> Catálogo de Prêmios
            </div>
            <h1 className="text-4xl font-display font-black tracking-tight">RASPADINHAS <span className="text-primary">DISPONÍVEIS</span></h1>
            <p className="text-muted-foreground">
              Escolha entre nossa variedade de jogos. Temos desde raspadinhas grátis até grandes prêmios acumulados.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar raspadinha..." 
                className="pl-9 bg-surface/50 border-border/50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0 border-border/50">
              <Filter className="size-4" />
            </Button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
          <Button variant="default" size="sm" className="rounded-full px-6">Todas</Button>
          <Button variant="outline" size="sm" className="rounded-full px-6 border-border/50">Grátis</Button>
          <Button variant="outline" size="sm" className="rounded-full px-6 border-border/50">Mais Jogadas</Button>
          <Button variant="outline" size="sm" className="rounded-full px-6 border-border/50">Grandes Prêmios</Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-3xl bg-surface animate-pulse border border-border/50" />
            ))}
          </div>
        ) : filteredCards && filteredCards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCards.map((card) => (
              <ScratchCardTile key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 surface-card border-dashed border-2">
            <Ticket className="size-16 text-muted-foreground mx-auto mb-4 opacity-10" />
            <h3 className="text-xl font-bold">Nenhuma raspadinha encontrada</h3>
            <p className="text-muted-foreground mt-2">Tente ajustar sua busca ou explore outras categorias.</p>
            <Button variant="link" onClick={() => setSearchTerm('')} className="mt-4 text-primary">
              Limpar busca
            </Button>
          </div>
        )}

        {/* Bottom Banner */}
        <div className="mt-20 p-8 sm:p-12 rounded-[2rem] bg-gradient-brand text-primary-foreground relative overflow-hidden group">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl font-display font-black mb-4">GANHE CRÉDITOS EXTRAS!</h2>
            <p className="text-primary-foreground/80 mb-8 text-lg leading-relaxed">
              Complete seu perfil e verifique sua conta para ganhar 3 tickets grátis na nossa Raspadinha da Sorte.
            </p>
            <Button size="lg" variant="secondary" className="font-bold group-hover:scale-105 transition-transform">
              COMPLETAR PERFIL <Zap className="ml-2 size-4 fill-current" />
            </Button>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-700">
            <Ticket className="size-96 rotate-12" />
          </div>
        </div>
      </div>
    </PublicPage>
  );
}
