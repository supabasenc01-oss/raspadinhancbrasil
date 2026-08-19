# Plano de Implementação: Controle de Visibilidade da Home no Painel Admin

Este plano descreve a implementação de um sistema de controle dinâmico no painel administrativo para habilitar ou desabilitar seções específicas da página inicial, conforme solicitado pelo usuário.

## Objetivos
- Permitir que o administrador escolha quais seções aparecem na Home.
- Controlar seções como: Banners, Ticker de Ganhadores, Demonstração, Grade de Raspadinhas, Como Jogar, Últimos Ganhadores, Depoimentos e Banner de Download do App.
- Garantir que as configurações sejam persistentes e reflitam instantaneamente no frontend.

## Arquitetura Técnica

### 1. Banco de Dados
- Utilizar a tabela existente `system_settings` para armazenar as preferências de visibilidade.
- Chaves a serem adicionadas/gerenciadas:
  - `show_hero_banners` (boolean)
  - `show_winners_ticker` (boolean)
  - `show_scratch_demo` (boolean)
  - `show_scratch_cards` (boolean)
  - `show_how_to_play` (boolean)
  - `show_latest_winners` (boolean)
  - `show_testimonials` (boolean)
  - `show_app_download` (boolean)

### 2. Backend (Server Functions)
- A função `updateSystemSettings` em `src/lib/settings.functions.ts` já suporta atualizações em lote.
- A consulta `systemSettingsQuery` em `src/lib/queries.ts` já busca todas as configurações.

### 3. Frontend (Admin)
- Atualizar `src/routes/_authenticated/admin/configuracoes.tsx` para incluir uma nova aba "Layout da Home".
- Adicionar switches (toggles) para cada seção.

### 4. Frontend (Public Home)
- Atualizar `src/routes/index.tsx` para ler estas configurações via `useSettings()`.
- Envolver as seções em condicionais baseadas nos valores retornados.

## Etapas de Implementação

1. **Migração de Dados**: Inserir os valores iniciais (default true) na tabela `system_settings` via SQL.
2. **Atualização do Hook**: Atualizar `src/hooks/useSettings.ts` para incluir as novas chaves com helpers booleanos.
3. **Atualização do Painel**: Criar a interface de toggles na página de configurações do admin.
4. **Condicionais na Home**: Aplicar a lógica de exibição em `src/routes/index.tsx`.
5. **Ajuste nos Componentes**: Refinar o `AppDownloadBanner` para respeitar a configuração global.

## Verificação
- Acessar o Painel Admin > Configurações > Layout da Home.
- Alternar os estados e verificar a persistência no banco de dados.
- Validar se a Home reflete as mudanças corretamente.
