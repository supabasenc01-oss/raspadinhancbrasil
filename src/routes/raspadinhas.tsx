import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ticket } from "lucide-react";

import { PageHero, PublicPage } from "@/components/layout/PublicPage";
import { ScratchCardTile } from "@/components/scratch/ScratchCardTile";
import { EmptyState } from "@/components/EmptyState";
import { publicScratchCardsQuery } from "@/lib/queries";

export const Route = createFileRoute("/raspadinhas")({
  head: () => ({
    meta: [
      { title: "Raspadinhas disponíveis — RaspaPremium" },
      {
        name: "description",
        content: "Veja todas as raspadinhas digitais disponíveis, com valores, prêmios e status.",
      },
      { property: "og:title", content: "Raspadinhas disponíveis — RaspaPremium" },
      {
        property: "og:description",
        content: "Todas as raspadinhas digitais disponíveis na plataforma.",
      },
    ],
  }),
  component: ScratchCardsPage,
});

function ScratchCardsPage() {
  const { data: cards, isLoading, error } = useQuery(publicScratchCardsQuery);

  return (
    <PublicPage>
      <PageHero
        eyebrow="Catálogo"
        title="Raspadinhas disponíveis"
        description="Todas as raspadinhas publicadas pela equipe, direto do banco de dados da plataforma."
      />

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="surface-card h-72 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            title="Não foi possível carregar as raspadinhas"
            description="Tente novamente em alguns instantes."
          />
        ) : cards && cards.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <ScratchCardTile key={card.id} card={card} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Ticket className="size-6" />}
            title="Nenhuma raspadinha publicada"
            description="Cadastre e ative raspadinhas no painel administrativo para que apareçam aqui."
          />
        )}
      </section>
    </PublicPage>
  );
}
