import { createFileRoute, Link } from "@tanstack/react-router";
import { CreditCard, Sparkles, Trophy, UserPlus } from "lucide-react";

import { PageHero, PublicPage } from "@/components/layout/PublicPage";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona — RaspaPremium" },
      {
        name: "description",
        content: "Entenda em 4 passos como participar das raspadinhas digitais da RaspaPremium.",
      },
      { property: "og:title", content: "Como funciona — RaspaPremium" },
      { property: "og:description", content: "Como participar das raspadinhas digitais." },
    ],
  }),
  component: HowItWorksPage,
});

const STEPS = [
  {
    icon: UserPlus,
    title: "Crie sua conta",
    description: "Cadastro rápido com e-mail e senha. Sessão persistente em qualquer dispositivo.",
  },
  {
    icon: CreditCard,
    title: "Escolha a raspadinha",
    description:
      "Cada raspadinha mostra valor, prêmios e período de participação de forma transparente.",
  },
  {
    icon: Sparkles,
    title: "Raspe e revele",
    description: "A revelação acontece na hora, com animação leve e interface pensada para celular.",
  },
  {
    icon: Trophy,
    title: "Acompanhe seus prêmios",
    description: "Todo o histórico de participação e prêmios fica registrado no seu painel.",
  },
];

function HowItWorksPage() {
  return (
    <PublicPage>
      <PageHero
        eyebrow="Passo a passo"
        title="Como funciona"
        description="Uma experiência simples, transparente e segura do cadastro ao prêmio."
      />
      <section className="mx-auto w-full max-w-5xl px-4 py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <div key={step.title} className="surface-card hover-lift p-6">
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-accent text-accent-foreground">
                <step.icon className="size-5" />
              </span>
              <p className="mt-4 text-xs font-medium text-primary">Passo {index + 1}</p>
              <h2 className="mt-1 font-display text-base font-semibold">{step.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="surface-card mt-10 p-6">
          <h2 className="font-display text-lg font-semibold">Compromisso de transparência</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Regras, probabilidades e quantidades de prêmios são cadastradas no painel administrativo
            e ficam visíveis na página de cada raspadinha. Plataforma destinada a maiores de 18 anos.
          </p>
          <Button asChild className="mt-5 bg-gradient-brand text-primary-foreground">
            <Link to="/raspadinhas">Ver raspadinhas</Link>
          </Button>
        </div>
      </section>
    </PublicPage>
  );
}
