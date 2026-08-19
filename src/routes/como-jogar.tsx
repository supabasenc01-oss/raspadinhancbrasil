import { createFileRoute } from "@tanstack/react-router";
import { PageHero, PublicPage } from "@/components/layout/PublicPage";
import { Zap, Play, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/como-jogar")({
  head: () => ({
    meta: [
      { title: "Como Jogar — RaspaPremium" },
      { name: "description", content: "Aprenda o passo a passo para se divertir na RaspaPremium." },
    ],
  }),
  component: HowToPlayPage,
});

function HowToPlayPage() {
  return (
    <PublicPage>
      <PageHero
        title="COMO <span class='text-primary'>JOGAR</span>"
        description="Aprenda em 3 passos simples como começar a sua jornada na maior plataforma de raspadinhas do Brasil."
        centered
      />
      <section className="mx-auto w-full max-w-4xl px-4 py-16 space-y-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl">1</div>
            <h2 className="text-2xl font-bold">Crie sua conta</h2>
          </div>
          <p className="pl-16 text-muted-foreground leading-relaxed">
            Realize um cadastro rápido. É seguro, simples e essencial para que você possa acumular prêmios e realizar saques via PIX.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl">2</div>
            <h2 className="text-2xl font-bold">Escolha e compre</h2>
          </div>
          <p className="pl-16 text-muted-foreground leading-relaxed">
            Navegue pelo nosso catálogo, escolha a raspadinha que mais lhe agrada pelo valor ou tipo de prêmio e realize a compra do ticket.
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl">3</div>
            <h2 className="text-2xl font-bold">Raspe e ganhe</h2>
          </div>
          <p className="pl-16 text-muted-foreground leading-relaxed">
            Use o mouse ou o dedo na tela do seu celular para raspar o ticket. O resultado é instantâneo e, se ganhar, o valor é seu!
          </p>
        </div>

        <div className="surface-card p-8 mt-12 bg-gradient-brand/5 border border-primary/10 text-center">
            <Zap className="size-8 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Dica de mestre</h3>
            <p className="text-sm text-muted-foreground">Fique atento às nossas raspadinhas temáticas de fim de semana! Elas costumam ter premiações turbinadas.</p>
        </div>
      </section>
    </PublicPage>
  );
}
