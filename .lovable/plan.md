# Plano de Implementação - Etapa 2: Motor de Raspadinhas e Prêmios

Este plano detalha a implementação do sistema real de sorteio, controle de estoque e interface de raspagem premium.

## Mudanças no Banco de Dados (Supabase)

- **Novas Tabelas:**
  - `scratch_card_results`: Registra cada jogada, o resultado (ganhou/perdeu), valor do prêmio e versão da configuração.
  - `scratch_card_sessions`: Gerencia a idempotência das jogadas, evitando cliques duplos ou requisições repetidas.
  - `winners`: Mural público de ganhadores reais, com nomes anonimizados por segurança.
- **Segurança e Lógica:**
  - Função PostgreSQL `draw_scratch_card`: Implementa o motor de sorteio inteiramente no servidor.
  - Controle de estoque atômico usando `FOR UPDATE` e transações SQL.
  - Versionamento de configuração (`config_version`) na tabela `scratch_cards`.

## Funcionalidades do Motor de Sorteio

- **Backend-Only:** O sorteio é processado via RPC no Supabase, garantindo que as probabilidades nunca vazem para o frontend.
- **Probabilidades Reais:** Soma das probabilidades validada (o restante é "Sem Prêmio").
- **Estoque Dinâmico:** Prêmios com quantidade zero são ignorados no sorteio.
- **Anti-Fraude:** Idempotência via tabela de sessões para evitar múltiplas jogadas por clique.

## Frontend e Interface Premium

- **Nova Rota de Jogo (`/raspadinha/$slug`):**
  - Implementação de Canvas interativo para raspagem manual (Mouse/Touch).
  - Opção de "Revelar Tudo" com animação automática.
  - Efeitos visuais de vitória: Confetes (`canvas-confetti`), brilhos e animações de valor.
- **Wizard Administrativo (`/admin/raspadinhas/novo`):**
  - Fluxo passo a passo: Informações > Visual > Preço > Prêmios > Revisão.
  - Interface para configurar até 20 prêmios por raspadinha com validação de probabilidade.
- **Mural de Ganhadores:**
  - Página `/ganhadores` agora exibe dados reais do banco de dados.

## Detalhes Técnicos

- **Tecnologias:** TanStack Start (Server Functions), Supabase RPC, Tailwind CSS, Canvas API.
- **Segurança:** RLS ativado em todas as novas tabelas, garantindo que usuários vejam apenas seus próprios resultados.
