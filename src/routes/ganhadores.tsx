import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";

import { PageHero, PublicPage } from "@/components/layout/PublicPage";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/ganhadores")({
  head: () => ({
    meta: [
      { title: "Ganhadores — RaspaPremium" },
      {
        name: "description",
        content: "Acompanhe os ganhadores confirmados das raspadinhas da RaspaPremium.",
      },
      { property: "og:title", content: "Ganhadores — RaspaPremium" },
      { property: "og:description", content: "Ganhadores confirmados das nossas raspadinhas." },
    ],
  }),
  component: WinnersPage,
});

function WinnersPage() {
  return (
    <PublicPage>
      <PageHero
        eyebrow="Transparência"
        title="Ganhadores"
        description="Publicaremos aqui apenas ganhadores reais, confirmados após a ativação do motor de sorteio."
      />
      <section className="mx-auto w-full max-w-4xl px-4 py-12">
        <EmptyState
          icon={<Trophy className="size-6" />}
          title="Nenhum ganhador confirmado até o momento"
          description="Por política da plataforma, não exibimos ganhadores fictícios. Esta lista será alimentada automaticamente quando o sorteio entrar em operação."
        />
      </section>
    </PublicPage>
  );
}
