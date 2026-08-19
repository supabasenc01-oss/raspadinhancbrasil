import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { 
  Zap, 
  ShieldCheck, 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  Ticket,
  Clock,
  History
} from 'lucide-react';

import { PublicPage, PageHero } from '@/components/layout/PublicPage';
import { Button } from '@/components/ui/button';
import { activeScratchCardsQuery } from '@/lib/queries';
import { ScratchCardTile } from '@/components/scratch/ScratchCardTile';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const { data: scratchCards, isLoading } = useQuery(activeScratchCardsQuery);

  return (
    <PublicPage>
      {/* Hero Section */}
      <PageHero 
        title="ETAPA 3 — CARTEIRA FINANCEIRA + MERCADO PAGO CHECKOUT TRANSPARENTE"
        description="ETAPA 3 — CARTEIRA FINANCEIRA + MERCADO PAGO CHECKOUT TRANSPARENTE
Agora implementar o sistema financeiro da plataforma.
IMPORTANTE:
O gateway oficial será:
MERCADO PAGO
Utilizar:
MERCADO PAGO CHECKOUT TRANSPARENTE
O pagamento deve acontecer dentro da própria plataforma, sem redirecionar o usuário para o Checkout Pro.
Utilizar a integração atual recomendada pelo Mercado Pago, preferencialmente a Orders API quando compatível com o fluxo.
Consultar a documentação oficial atual do Mercado Pago antes de implementar qualquer endpoint que tenha mudado.
MÉTODOS
Implementar inicialmente:
- PIX.
- Cartão de crédito.
- Cartão de débito, se disponível para a conta/configuração.
Para cartões, utilizar o mecanismo oficial do Mercado Pago, como Card Payment Brick, quando apropriado.
Para Pix, mostrar:
- QR Code.
- Pix Copia e Cola.
- Status do pagamento.
SEGURANÇA
NUNCA colocar o Access Token do Mercado Pago no frontend.
O Access Token deverá existir exclusivamente como Secret/Environment Variable no backend/Supabase Edge Functions.
Criar variáveis:
MERCADOPAGO_ACCESS_TOKEN
MERCADOPAGO_PUBLIC_KEY
Não expor secrets no código público.
BANCO
Criar:
wallets
wallet_transactions
deposits
payment_transactions
webhook_events
Campos apropriados:
wallets:
id
user_id
balance
created_at
updated_at
wallet_transactions:
id
user_id
type
amount
balance_before
balance_after
reference_id
description
status
created_at
deposits:
id
user_id
amount
status
payment_provider
external_id
created_at
updated_at
payment_transactions:
id
user_id
deposit_id
provider
external_id
amount
payment_method
status
status_detail
external_reference
raw_response
created_at
updated_at
webhook_events:
id
provider
event_id
event_type
payload
processed
processed_at
created_at
CARTEIRA
Criar página:
/carteira
Mostrar:
Saldo disponível.
Botão:
&quot;Adicionar saldo&quot;
Extrato:
- Depósito.
- Compra de raspadinha.
- Prêmio.
- Estorno.
- Ajuste administrativo.
ADICIONAR SALDO
Criar página/modal:
&quot;Adicionar saldo&quot;
Valores:
R$ 10
R$ 20
R$ 50
R$ 100
R$ 200
R$ 500
R$ 1.000
Também permitir valor personalizado.
Depois:
Usuário escolhe:
PIX
ou
CARTÃO
MERCADO PAGO
Criar uma Edge Function:
create-payment
Essa função deverá:
1. Validar usuário.
2. Validar valor.
3. Criar registro de depósito como PENDING.
4. Criar identificador externo único.
5. Criar chave de idempotência.
6. Enviar requisição ao Mercado Pago.
7. Salvar resposta.
8. Retornar ao frontend somente os dados necessários para concluir o pagamento.
Nunca confiar em dados financeiros enviados pelo frontend.
PIX
Após criar pagamento:
Mostrar:
QR Code.
Código Pix Copia e Cola.
Valor.
Status:
Aguardando pagamento.
Criar atualização automática do status.
WEBHOOK
Criar Edge Function:
mercadopago-webhook
Ela deverá:
- Receber notificações.
- Validar evento.
- Consultar o Mercado Pago quando necessário.
- Identificar pagamento.
- Garantir idempotência.
- Atualizar payment_transactions.
- Atualizar deposits.
- Creditar carteira somente quando o pagamento estiver efetivamente confirmado.
- Registrar webhook_events.
NUNCA creditar saldo apenas porque o frontend informou &quot;pagamento aprovado&quot;.
IDEMPOTÊNCIA
Toda criação de pagamento deverá possuir chave única de idempotência.
Não permitir que uma requisição repetida gere dois créditos.
Também impedir que um mesmo webhook seja processado duas vezes.
CRÉDITO
Somente quando o backend confirmar o status válido do pagamento:
deposit.status = PAID
Então:
wallet.balance += deposit.amount
Criar wallet_transaction.
Salvar:
balance_before
balance_after
COMPRA DE RASPADINHA
Agora conectar a carteira ao motor da raspadinha.
Para raspadinha paga:
1. Verificar saldo.
2. Criar operação transacional.
3. Debitar preço.
4. Criar jogada.
5. Gerar resultado.
6. Registrar prêmio.
7. Atualizar carteira se houver prêmio.
Tudo de forma atômica.
CONCORRÊNCIA
Dois cliques simultâneos não poderão gastar o mesmo saldo.
Utilizar transações PostgreSQL, locks ou mecanismo equivalente.
Nunca permitir:
saldo negativo.
ESTORNO
Preparar estrutura para estornos.
Não implementar estorno automático sem regra explícita.
ADMIN FINANCEIRO
Criar painel:
Financeiro
Mostrar:
- Total depositado.
- Depósitos pendentes.
- Depósitos aprovados.
- Pagamentos recusados.
- Volume por dia.
- Volume por período.
Filtros:
- Data.
- Usuário.
- Status.
- Método.
- ID Mercado Pago.
CONFIGURAÇÕES
Criar área administrativa para configurar:
Mercado Pago:
- Public Key.
- Status.
- Ambiente teste/produção.
O Access Token NÃO deverá ser exibido na interface depois de configurado.
AMBIENTE
Criar suporte para:
TEST
PRODUCTION
Nunca misturar credenciais.
IMPORTANTE
Não utilizar Checkout Pro.
O fluxo deverá ser Checkout Transparente.
Não armazenar dados completos de cartão.
Utilizar os mecanismos oficiais do Mercado Pago para tokenização e processamento.
Ao finalizar esta etapa, testar:
PIX TESTE
CARTÃO TESTE
WEBHOOK
CRÉDITO DA CARTEIRA
DÉBITO DA CARTEIRA
DUPLICIDADE
ERROS DE PAGAMENTO
Não considerar a etapa concluída enquanto o saldo puder ser creditado sem confirmação segura do Mercado Pago."
        centered
      >

        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Button size="lg" className="bg-gradient-brand text-primary-foreground group" asChild>
            <Link to="/raspadinhas">
              VER TODAS AS RASPADINHAS 
              <Zap className="ml-2 size-4 group-hover:scale-110 transition-transform" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/como-funciona">
              SAIBA MAIS
            </Link>
          </Button>
        </div>
      </PageHero>

      {/* Stats / Features Bar */}
      <div className="border-y border-border/50 bg-surface/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="text-2xl font-black text-primary">100%</div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">SEGURO & AUDITÁVEL</div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="text-2xl font-black text-primary">INSTANTÂNEO</div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">PRÊMIOS NA HORA</div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="text-2xl font-black text-primary">+20</div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">PRÊMIOS POR JOGO</div>
            </div>
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="text-2xl font-black text-primary">PIX</div>
              <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">PAGAMENTOS RÁPIDOS</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Scratch Cards */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-black tracking-tight">
                RASPADINHAS <span className="text-primary">POPULARES</span>
              </h2>
              <p className="text-muted-foreground">Escolha a sua favorita e tente a sorte agora mesmo.</p>
            </div>
            <Button variant="ghost" className="group" asChild>
              <Link to="/raspadinhas">
                Ver todas <ArrowRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[3/4] rounded-3xl bg-surface animate-pulse" />
              ))}
            </div>
          ) : scratchCards && scratchCards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {scratchCards.map((card) => (
                <ScratchCardTile key={card.id} card={card} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 surface-card">
              <Ticket className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium">Nenhuma raspadinha ativa no momento</h3>
              <p className="text-sm text-muted-foreground mt-1">Volte em breve para novas oportunidades.</p>
            </div>
          )}
        </div>
      </section>

      {/* How it Works (Brief) */}
      <section className="py-20 bg-primary/[0.02] border-y border-primary/5">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-display font-black">COMO <span className="text-primary">JOGAR</span></h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { 
                icon: Ticket, 
                title: "1. Escolha", 
                desc: "Selecione uma das raspadinhas disponíveis no catálogo." 
              },
              { 
                icon: Zap, 
                title: "2. Raspe", 
                desc: "Compre seu ticket e use o mouse ou dedo para revelar o prêmio." 
              },
              { 
                icon: Trophy, 
                title: "3. Ganhe", 
                desc: "Se encontrar o prêmio, o valor é creditado instantaneamente." 
              }
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center space-y-4">
                <div className="size-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                  <step.icon className="size-8" />
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Winners */}
      <section className="py-20 px-4 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-12">
            <div className="size-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <Trophy className="size-5" />
            </div>
            <h2 className="text-3xl font-display font-black tracking-tight">ÚLTIMOS <span className="text-accent">GANHADORES</span></h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "João M.***", prize: "Raspadinha Gold", amount: 500, time: "2 min atrás" },
              { name: "Maria S.***", prize: "Sorte Instantânea", amount: 50, time: "5 min atrás" },
              { name: "Pedro R.***", prize: "Mega Raspa", amount: 1000, time: "12 min atrás" },
            ].map((winner, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border/50 hover:border-accent/30 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-accent/5 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <History className="size-5" />
                  </div>
                  <div>
                    <div className="font-bold">{winner.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" /> {winner.time}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-primary">R$ {winner.amount},00</div>
                  <div className="text-[10px] uppercase tracking-tighter text-muted-foreground">{winner.prize}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/ganhadores">VER TODOS OS GANHADORES</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
