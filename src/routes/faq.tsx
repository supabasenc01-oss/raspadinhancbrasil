import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PublicPage } from "@/components/layout/PublicPage";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — RaspaPremium" },
      {
        name: "description",
        content: "Dúvidas sobre cadastro, raspadinhas, prêmios e segurança na RaspaPremium.",
      },
      { property: "og:title", content: "Perguntas frequentes — RaspaPremium" },
      { property: "og:description", content: "Dúvidas sobre cadastro, raspadinhas e prêmios." },
    ],
  }),
  component: FaqPage,
});

const FAQ_ITEMS = [
  {
    question: "Preciso pagar para criar uma conta?",
    answer: "Não. O cadastro é gratuito e leva menos de um minuto.",
  },
  {
    question: "Como sei quais prêmios existem em cada raspadinha?",
    answer:
      "Cada raspadinha exibe a lista de prêmios cadastrados pela equipe, com valores e descrição.",
  },
  {
    question: "Os pagamentos já estão disponíveis?",
    answer:
      "Ainda não. Esta versão entrega a estrutura da plataforma; carteira e pagamentos entram nas próximas etapas.",
  },
  {
    question: "Como recupero minha senha?",
    answer:
      "Na tela de login, use 'Esqueci minha senha'. Você receberá um link por e-mail para criar uma nova senha.",
  },
  {
    question: "Quem pode acessar o painel administrativo?",
    answer:
      "Apenas contas com perfil de acesso da equipe (Super Admin, Admin, Operador, Financeiro ou Suporte).",
  },
];

function FaqPage() {
  return (
    <PublicPage>
      <PageHero
        eyebrow="Ajuda"
        title="Perguntas frequentes"
        description="As dúvidas mais comuns sobre a plataforma."
      />
      <section className="mx-auto w-full max-w-3xl px-4 py-12">
        <Accordion type="single" collapsible className="surface-card px-5">
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger className="text-left text-sm">{item.question}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </PublicPage>
  );
}
