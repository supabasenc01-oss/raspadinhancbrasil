import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, Gift, Ticket } from "lucide-react";

import { PublicPage } from "@/components/layout/PublicPage";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFileUrl } from "@/hooks/useFileUrl";
import { formatCurrency, formatDate } from "@/lib/format";
import { scratchCardBySlugQuery } from "@/lib/queries";

export const Route = createFileRoute("/raspadinha/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Raspadinha ${params.slug} — RaspaPremium` },
      {
        name: "description",
        content: "Detalhes da raspadinha: valor, prêmios disponíveis e período de participação.",
      },
      { property: "og:title", content: `Raspadinha ${params.slug} — RaspaPremium` },
      {
        property: "og:description",
        content: "Detalhes da raspadinha: valor, prêmios e período de participação.",
      },
    ],
  }),
  component: ScratchCardDetailPage,
});

function ScratchCardDetailPage() {
  const { slug } = Route.useParams();
  const { data: card, isLoading } = useQuery(scratchCardBySlugQuery(slug));
  const { isAuthenticated } = useAuth();
  const imageUrl = useFileUrl(card?.image_url);

  if (isLoading) {
    return (
      <PublicPage>
        <div className="mx-auto w-full max-w-5xl px-4 py-16">
          <div className="surface-card h-80 animate-pulse" />
        </div>
      </PublicPage>
    );
  }

  if (!card) {
    return (
      <PublicPage>
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <EmptyState
            icon={<Ticket className="size-6" />}
            title="Raspadinha não encontrada"
            description="Ela pode ter sido encerrada ou ainda não está publicada."
            action={
              <Button asChild variant="secondary" className="mt-2">
                <Link to="/raspadinhas">Ver raspadinhas disponíveis</Link>
              </Button>
            }
          />
        </div>
      </PublicPage>
    );
  }

  const prizes = card.scratch_card_prizes ?? [];

  return (
    <PublicPage>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="surface-card overflow-hidden">
          <div className="aspect-[16/10] bg-surface-2">
            {imageUrl ? (
              <img src={imageUrl} alt={card.name} className="size-full object-cover" />
            ) : (
              <div className="bg-hero-glow grid size-full place-items-center text-muted-foreground">
                <Ticket className="size-12" />
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {card.badge && (
              <Badge className="border-0 bg-gradient-brand text-primary-foreground">
                {card.badge}
              </Badge>
            )}
            {card.is_free && (
              <Badge variant="secondary" className="border border-accent/40 text-accent">
                Grátis
              </Badge>
            )}
            <Badge variant="outline" className="text-muted-foreground">
              {card.status === "ACTIVE" ? "Disponível" : card.status}
            </Badge>
          </div>

          <h1 className="mt-4 text-3xl font-bold">{card.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {card.description ?? "Raspe e descubra o seu prêmio."}
          </p>

          <div className="surface-card mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="text-xs text-muted-foreground">Valor da raspadinha</p>
              <p className="font-display text-2xl font-semibold text-primary">
                {card.is_free ? "Grátis" : formatCurrency(card.price)}
              </p>
            </div>
            <Button
              asChild={!isAuthenticated}
              disabled={isAuthenticated}
              className="bg-gradient-brand text-primary-foreground"
            >
              {isAuthenticated ? (
                <span>Jogo disponível na próxima etapa</span>
              ) : (
                <Link to="/cadastro">Criar conta para participar</Link>
              )}
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <CalendarClock className="size-4" /> Início: {formatDate(card.starts_at)}
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarClock className="size-4" /> Encerramento: {formatDate(card.ends_at)}
            </span>
          </div>

          <h2 className="mt-10 text-lg font-semibold">Prêmios desta raspadinha</h2>
          <div className="mt-4 space-y-3">
            {prizes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Os prêmios ainda não foram publicados para esta raspadinha.
              </p>
            ) : (
              prizes.map((prize) => (
                <div
                  key={prize.id}
                  className="surface-card flex items-center justify-between gap-4 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary">
                      <Gift className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{prize.title}</p>
                      {prize.description && (
                        <p className="text-xs text-muted-foreground">{prize.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-display text-sm font-semibold text-primary">
                    {formatCurrency(prize.value)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PublicPage>
  );
}
