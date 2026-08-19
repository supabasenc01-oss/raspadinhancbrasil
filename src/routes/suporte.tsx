import { createFileRoute } from "@tanstack/react-router";
import { PageHero, PublicPage } from "@/components/layout/PublicPage";
import { MessageSquare, Mail, Phone, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte Técnico — RaspaPremium" },
      { name: "description", content: "Precisa de ajuda? Entre em contato com a equipe de suporte da RaspaPremium." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <PublicPage>
      <PageHero
        title="SUPORTE <span class='text-primary'>TÉCNICO</span>"
        description="Nossa equipe está disponível 24 horas por dia, 7 dias por semana para ajudar você."
        centered
      />
      <section className="mx-auto w-full max-w-5xl px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-black font-display tracking-tight mb-4 uppercase">Canais de Contato</h2>
              <p className="text-muted-foreground">Escolha a melhor forma de falar conosco. Respondemos em minutos.</p>
            </div>

            <div className="space-y-4">
              <div className="surface-card p-6 flex items-center gap-6 border-l-4 border-primary">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Mail className="size-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest">E-mail</div>
                  <div className="text-lg font-bold">suporte@raspapremium.com</div>
                </div>
              </div>

              <div className="surface-card p-6 flex items-center gap-6 border-l-4 border-success">
                <div className="size-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
                  <Phone className="size-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest">WhatsApp</div>
                  <div className="text-lg font-bold">+55 (11) 99999-9999</div>
                </div>
              </div>

              <div className="surface-card p-6 flex items-center gap-6 border-l-4 border-accent">
                <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <Clock className="size-6" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Atendimento</div>
                  <div className="text-lg font-bold">24h / 7 dias por semana</div>
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card p-8 border border-border/50 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">Mande uma mensagem</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Nome Completo</label>
                <input type="text" className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="Seu nome" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Assunto</label>
                <select className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors">
                  <option>Dúvida sobre depósitos</option>
                  <option>Problema com raspadinha</option>
                  <option>Solicitação de saque</option>
                  <option>Outro assunto</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Mensagem</label>
                <textarea className="w-full bg-surface-2 border border-border/50 rounded-xl px-4 py-3 text-sm h-32 resize-none focus:outline-none focus:border-primary transition-colors" placeholder="Como podemos ajudar?"></textarea>
              </div>
              <Button className="w-full h-12 bg-gradient-brand text-primary-foreground group">
                ENVIAR MENSAGEM <Send className="ml-2 size-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </form>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
