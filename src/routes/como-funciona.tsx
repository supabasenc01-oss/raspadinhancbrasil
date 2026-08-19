import { createFileRoute, Link } from '@tanstack/react-router';
import { 
  Ticket, 
  Zap, 
  Trophy, 
  ShieldCheck, 
  ArrowRight,
  UserPlus,
  Gamepad2,
  Wallet
} from 'lucide-react';

import { PublicPage } from '@/components/layout/PublicPage';
import { PageHero } from '@/components/layout/PageHero';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/como-funciona')({
  component: HowItWorksPage,
});

function HowItWorksPage() {
  const steps = [
    {
      icon: UserPlus,
      title: "1. Crie sua conta",
      desc: "Cadastre-se gratuitamente em segundos. Nossa plataforma é segura e protege seus dados com criptografia de ponta.",
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      icon: Wallet,
      title: "2. Adicione Saldo",
      desc: "Utilize PIX para depósitos instantâneos. Você também pode começar com nossas raspadinhas grátis diárias.",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: Gamepad2,
      title: "3. Escolha e Jogue",
      desc: "Navegue pelo nosso catálogo premium, escolha sua raspadinha favorita e sinta a emoção de revelar o prêmio.",
      color: "bg-accent/10 text-accent"
    },
    {
      icon: Trophy,
      title: "4. Resgate na Hora",
      desc: "Ganhou? O valor é creditado instantaneamente na sua carteira. Saque via PIX a qualquer momento.",
      color: "bg-success/10 text-success"
    }
  ];

  return (
    <PublicPage>
      <PageHero 
        title="COMO <span className='text-primary'>FUNCIONA</span>"
        description="Simples, rápido e 100% transparente. Entenda por que somos a plataforma de raspadinhas favorita do Brasil."
        centered
      />

      <div className="mx-auto max-w-7xl px-4 py-20">
        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
          {steps.map((step, i) => (
            <div key={i} className="surface-card p-8 flex flex-col items-center text-center space-y-4 hover:border-primary/20 transition-all hover:-translate-y-1">
              <div className={`size-16 rounded-2xl ${step.color} flex items-center justify-center mb-2`}>
                <step.icon className="size-8" />
              </div>
              <h3 className="text-xl font-bold">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Security / Transparency Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-bold text-accent uppercase tracking-wider">
              <ShieldCheck className="size-3" /> Segurança Máxima
            </div>
            <h2 className="text-4xl font-display font-black tracking-tight leading-tight">
              TECNOLOGIA DE SORTEIO <span className="text-accent">AUDITÁVEL</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Nossa plataforma utiliza um motor de sorteio baseado em algoritmos de alta fidelidade e segurança. 
              Ao contrário das raspadinhas físicas, nossos estoques de prêmios são atualizados em tempo real, 
              garantindo que todas as probabilidades exibidas sejam reais e justas.
            </p>
            <ul className="space-y-4">
              {[
                "Resultados gerados exclusivamente no servidor.",
                "Criptografia de ponta a ponta em todas as transações.",
                "Histórico completo de jogadas acessível ao usuário.",
                "Auditoria constante das tabelas de prêmios."
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium">
                  <div className="size-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    <Zap className="size-3 fill-current" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="relative">
            <div className="aspect-square rounded-[3rem] bg-gradient-to-br from-primary/20 via-accent/20 to-surface border border-border/50 flex items-center justify-center p-12 overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              <Ticket className="size-64 text-primary rotate-12 drop-shadow-2xl animate-float" />
            </div>
            {/* Floating stats card */}
            <div className="absolute -bottom-6 -left-6 surface-card p-6 shadow-2xl border-primary/20 animate-in slide-in-from-bottom-8 duration-1000">
              <div className="text-4xl font-black text-primary">100%</div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Transparente</div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-32 text-center space-y-8 bg-surface border border-border p-12 rounded-[3rem]">
          <h2 className="text-3xl font-display font-black">PRONTO PARA TENTAR SUA SORTE?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Milhares de usuários já ganharam prêmios hoje. Comece com uma de nossas raspadinhas grátis.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" className="bg-gradient-brand text-primary-foreground" asChild>
              <Link to="/raspadinhas">
                IR PARA O CATÁLOGO <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/cadastro">CRIAR CONTA GRÁTIS</Link>
            </Button>
          </div>
        </div>
      </div>
    </PublicPage>
  );
}
