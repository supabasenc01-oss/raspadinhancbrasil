import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PublicPage } from "@/components/layout/PublicPage";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — RaspaPremium" },
      { name: "description", content: "Termos e condições de uso da plataforma RaspaPremium." },
      { property: "og:title", content: "Termos de uso — RaspaPremium" },
      { property: "og:description", content: "Termos e condições de uso da plataforma." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PublicPage>
      <PageHero eyebrow="Legal" title="Termos de uso" description="Última atualização: versão inicial da plataforma." />
      <section className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12 text-sm text-muted-foreground">
        <div className="surface-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground">1. Aceitação</h2>
          <p className="mt-2">
            Ao criar uma conta você declara ter no mínimo 18 anos e concorda com estes termos.
          </p>
        </div>
        <div className="surface-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground">2. Conta e segurança</h2>
          <p className="mt-2">
            Você é responsável por manter suas credenciais em segurança e pelas ações realizadas em
            sua conta.
          </p>
        </div>
        <div className="surface-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground">3. Raspadinhas e prêmios</h2>
          <p className="mt-2">
            As regras, quantidades e valores dos prêmios são divulgados na página de cada
            raspadinha. Funcionalidades de pagamento e sorteio serão disponibilizadas em etapas
            posteriores e comunicadas previamente.
          </p>
        </div>
        <div className="surface-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground">4. Jogo responsável</h2>
          <p className="mt-2">
            Incentivamos o uso consciente da plataforma. Defina limites e procure apoio caso o jogo
            deixe de ser entretenimento.
          </p>
        </div>
      </section>
    </PublicPage>
  );
}
