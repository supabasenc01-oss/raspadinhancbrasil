import { createFileRoute } from "@tanstack/react-router";
import { PageHero, PublicPage } from "@/components/layout/PublicPage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion";
import { HelpCircle, Mail, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/faq")({
    head: () => ({
        meta: [
            { title: "Ajuda e Suporte — RaspaPremium" },
            {
                name: "description",
                content: "Central de ajuda da RaspaPremium. Dúvidas sobre cadastro, raspadinhas, prêmios e pagamentos.",
            },
            { property: "og:title", content: "Ajuda e Suporte — RaspaPremium" },
            { property: "og:description", content: "Tire suas dúvidas sobre a plataforma de raspadinhas mais moderna do Brasil." },
        ],
    }),
    component: HelpPage,
});
const FAQ_ITEMS = [
    {
        question: "Como funciona a raspadinha?",
        answer: "Você escolhe uma raspadinha no catálogo, compra o seu ticket e raspa a área indicada com o mouse ou o dedo. Se encontrar os símbolos ou valores premiados, o prêmio é creditado na sua carteira instantaneamente.",
    },
    {
        question: "Como faço um depósito?",
        answer: "Acesse sua 'Carteira', clique em 'Adicionar Saldo', escolha o valor e o método de pagamento (PIX ou Cartão via Mercado Pago). O saldo é liberado assim que o pagamento for confirmado.",
    },
    {
        question: "Os sorteios são justos?",
        answer: "Sim. Todos os resultados são gerados pelo nosso motor de sorteio no servidor, utilizando algoritmos auditáveis que garantem a aleatoriedade e conformidade com as probabilidades descritas em cada jogo.",
    },
    {
        question: "Como saco meus prêmios?",
        answer: "Os prêmios são creditados em sua carteira digital. Você pode solicitar o saque via PIX diretamente no painel financeiro, respeitando o valor mínimo de saque da plataforma.",
    },
    {
        question: "É seguro jogar na RaspaPremium?",
        answer: "Absolutamente. Utilizamos criptografia de ponta a ponta, processamento de pagamentos via Mercado Pago e seguimos rigorosos padrões de segurança de dados para proteger sua conta e seu saldo.",
    },
];
function HelpPage() {
    return (<PublicPage>
      <PageHero title="CENTRAL DE AJUDA" description="Tire suas dúvidas e aprenda a aproveitar o máximo da plataforma." centered/>

      <section className="mx-auto w-full max-w-7xl px-4 py-16">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* FAQ Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <HelpCircle className="size-6"/>
              </div>
              <h2 className="text-2xl font-black font-display tracking-tight">PERGUNTAS FREQUENTES</h2>
            </div>
            
            <Accordion type="single" collapsible className="space-y-4">
              {FAQ_ITEMS.map((item, i) => (<AccordionItem key={i} value={`item-${i}`} className="surface-card px-6 border border-border/50 rounded-2xl overflow-hidden">
                  <AccordionTrigger className="text-left font-bold py-5 hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>))}
            </Accordion>
          </div>

          {/* Contact Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <MessageSquare className="size-6"/>
              </div>
              <h2 className="text-2xl font-black font-display tracking-tight">CONTATO</h2>
            </div>

            <div className="surface-card p-8 space-y-6">
              <p className="text-sm text-muted-foreground">
                Não encontrou o que procurava? Nossa equipe de suporte está pronta para ajudar você.
              </p>
              
              <div className="space-y-4">
                <Button className="w-full justify-start h-14 bg-surface border border-border/50 hover:bg-surface-2 transition-colors" variant="ghost">
                  <Mail className="size-5 mr-3 text-primary"/>
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest">E-mail</div>
                    <div className="text-sm font-bold">suporte@raspapremium.com</div>
                  </div>
                </Button>

                <Button className="w-full justify-start h-14 bg-surface border border-border/50 hover:bg-surface-2 transition-colors" variant="ghost">
                  <Phone className="size-5 mr-3 text-success"/>
                  <div className="text-left">
                    <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest">WhatsApp</div>
                    <div className="text-sm font-bold">+55 (11) 99999-9999</div>
                  </div>
                </Button>
              </div>

              <div className="pt-6 border-t border-border/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Horário de Atendimento:</span>
                  <span className="font-bold text-primary">24h / 7 dias</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicPage>);
}
