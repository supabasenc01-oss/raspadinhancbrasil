import { createFileRoute } from "@tanstack/react-router";
import { PageHero, PublicPage } from "@/components/layout/PublicPage";
import { ShieldCheck, Target, HeartHandshake, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/jogo-responsavel")({
  head: () => ({
    meta: [
      { title: "Jogo Responsável — RaspaPremium" },
      { name: "description", content: "Nosso compromisso com um ambiente de jogo seguro e responsável." },
    ],
  }),
  component: ResponsibleGamingPage,
});

function ResponsibleGamingPage() {
  return (
    <PublicPage>
      <PageHero
        eyebrow="Compromisso"
        title="Jogo <span class='text-primary'>Responsável</span>"
        description="A sua diversão é nossa prioridade. Jogar deve ser um entretenimento, nunca um problema."
        centered
      />
      <section className="mx-auto w-full max-w-4xl px-4 py-16 space-y-8">
        <div className="surface-card p-8 border-l-4 border-primary">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <HeartHandshake className="text-primary" /> Nossa Filosofia
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Na RaspaPremium, acreditamos que o jogo deve ser uma forma de entretenimento leve.
            Encorajamos nossos jogadores a estabelecerem limites, jogarem de forma consciente e
            nunca buscarem no jogo uma fonte de renda.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="surface-card p-6">
            <h3 className="font-bold mb-2 flex items-center gap-2"><Target className="size-4 text-accent" /> Defina seus limites</h3>
            <p className="text-sm text-muted-foreground">Estabeleça limites de depósito, perdas e tempo de jogo antes de começar.</p>
          </div>
          <div className="surface-card p-6">
            <h3 className="font-bold mb-2 flex items-center gap-2"><ShieldCheck className="size-4 text-success" /> Acesso de menores</h3>
            <p className="text-sm text-muted-foreground">O acesso à plataforma é estritamente proibido para menores de 18 anos.</p>
          </div>
        </div>

        <div className="surface-card p-8 border border-accent/20 bg-accent/5">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-accent">
            <AlertTriangle /> Precisa de ajuda?
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Se você sente que o jogo está se tornando um problema, existem organizações profissionais 
            que oferecem suporte confidencial e gratuito. Não hesite em procurar ajuda.
          </p>
        </div>
      </section>
    </PublicPage>
  );
}
