import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gift, ShieldCheck, Sparkles, Ticket, Trophy, Zap } from "lucide-react";

import { PublicPage } from "@/components/layout/PublicPage";
import { ScratchCardTile } from "@/components/scratch/ScratchCardTile";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { useFileUrl } from "@/hooks/useFileUrl";
import { featuredScratchCardsQuery, heroBannersQuery } from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RaspaPremium — Raspadinhas online com prêmios reais" },
      {
        name: "description",
        content:
          "Raspadinhas digitais com experiência premium, prêmios transparentes e pagamento simples. Crie sua conta e comece a raspar.",
      },
      { property: "og:title", content: "RaspaPremium — Raspadinhas online" },
      {
        property: "og:description",
        content: "Plataforma premium de raspadinhas digitais com prêmios transparentes.",
      },
    ],
  }),
  component: HomePage,
});

function HeroBanner() {
  const { data: banners } = useQuery(heroBannersQuery);
  const banner = banners?.[0] ?? null;
  const imageUrl = useFileUrl(banner?.image_url);

  return (
    <div className="surface-card relative flex min-h-[200px] items-end overflow-hidden sm:min-h-[280px]">
      {imageUrl ? (
        <img src={imageUrl} alt={banner?.title ?? "Banner"} className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="bg-hero-glow absolute inset-0" />
      )}
      <div className="relative w-full bg-gradient-to-t from-background/90 to-transparent p-6">
        <p className="text-xs uppercase tracking-widest text-primary">
          {banner ? "Destaque" : "Espaço para banner"}
        </p>
        <p className="mt-1 font-display text-lg font-semibold">
          {banner?.title ?? "Publique seu banner pelo painel administrativo"}
        </p>
        {banner?.subtitle && <p className="mt-1 text-sm text-muted-foreground">{banner.subtitle}</p>}
      </div>
    </div>
  );
}

const STEPS = [
  {
    icon: Ticket,
    title: "Escolha sua raspadinha",
    description: "Navegue pelas raspadinhas disponíveis e veja os prêmios de cada edição.",
  },
  {
    icon: Sparkles,
    title: "Raspe e revele",
    description: "Interface rápida e fluida, otimizada para celular, com resultado imediato.",
  },
  {
    icon: Trophy,
    title: "Receba seu prêmio",
    description: "Prêmios confirmados ficam registrados na sua conta com histórico completo.",
  },
];

function HomePage() {
  const { data: featured, isLoading } = useQuery(featuredScratchCardsQuery);

  return (
    <PublicPage>
      <section className="bg-hero-glow border-b border-border/60">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Zap className="size-3.5" /> Experiência premium 2026
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight sm:text-5xl">
              Raspadinhas online com <span className="text-gradient-brand">emoção instantânea</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm text-muted-foreground sm:text-base">
              Uma plataforma moderna, transparente e feita para celular. Escolha sua raspadinha,
              revele o resultado e acompanhe tudo em um painel só seu.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gradient-brand text-primary-foreground">
                <Link to="/cadastro">Criar conta grátis</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/raspadinhas">Ver raspadinhas</Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success" />
              Plataforma com regras auditáveis e jogo responsável (+18).
            </div>
          </div>
          <HeroBanner />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Raspadinhas em destaque</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecionadas pela equipe e publicadas diretamente do painel.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/raspadinhas">Ver todas</Link>
          </Button>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="surface-card h-72 animate-pulse" />
              ))}
            </div>
          ) : featured && featured.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((card) => (
                <ScratchCardTile key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Ticket className="size-6" />}
              title="Nenhuma raspadinha em destaque"
              description="Assim que a equipe publicar e destacar raspadinhas no painel administrativo, elas aparecerão aqui."
            />
          )}
        </div>
      </section>

      <section className="border-y border-border/60 bg-surface/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-14">
          <h2 className="text-2xl font-semibold">Últimos ganhadores</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sempre exibiremos apenas ganhadores reais e confirmados pela plataforma.
          </p>
          <div className="mt-8">
            <EmptyState
              icon={<Trophy className="size-6" />}
              title="Ainda não há ganhadores confirmados"
              description="O módulo de sorteio será ativado na próxima etapa. Nenhum ganhador fictício será exibido."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-semibold">Como funciona</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <div key={step.title} className="surface-card hover-lift p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-accent text-accent-foreground">
                <step.icon className="size-5" />
              </span>
              <p className="mt-4 text-xs font-medium text-primary">Passo {index + 1}</p>
              <h3 className="mt-1 font-display text-base font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="surface-card mt-10 flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <Gift className="size-6 text-primary" />
            <p className="text-sm text-muted-foreground">
              Pronto para começar? Crie sua conta em menos de um minuto.
            </p>
          </div>
          <Button asChild className="bg-gradient-brand text-primary-foreground">
            <Link to="/cadastro">Criar minha conta</Link>
          </Button>
        </div>
      </section>
    </PublicPage>
  );
}
