# Auditoria Técnica e Correção de Bugs — RaspaPremium

Esta auditoria identificou pontos críticos de segurança, performance e UX. As correções seguem padrões de 2026, garantindo atomicidade e segurança.

## Problemas Identificados

### Segurança e Banco de Dados
- **RLS Permissivo**: Algumas tabelas financeiras tinham políticas incompletas de SELECT.
- **Grants Ausentes**: Verificação de grants para o papel `authenticated` em novas tabelas.
- **Exposição de Dados**: Verificação se PII (email) está vazando em listagens públicas (ganhadores).

### Lógica de Negócio (Backend)
- **Débito Financeiro**: O RPC `draw_scratch_card` precisa garantir que o débito da carteira e a criação da sessão de jogo sejam atômicos (confirmado via análise de código, mas exige validação de edge cases como saldo negativo durante concorrência).
- **Webhooks MP**: Validação de idempotência para evitar créditos duplos caso o Mercado Pago envie o mesmo webhook múltiplas vezes.

### Frontend e UX
- **Responsividade do Canvas**: Problemas detectados em viewports muito pequenos no componente de raspagem.
- **Hydration Mismatch**: Verificação de componentes que dependem do `window` ou data/hora local no SSR.
- **Feedback de Carregamento**: Estados de loading em botões de ação críticos.
- **Links Quebrados**: O catalogo `src/routes/raspadinhas.tsx` referencia rotas que podem ter conflitos de tipagem.

### Performance
- **Re-renderizações**: Componentes de animação (Framer Motion) rodando sem necessidade fora da viewport.
- **Query Caching**: Ajuste de `staleTime` em queries de saldo da carteira para evitar requisições excessivas.

## Plano de Implementação

### 1. Reforço de Segurança (Supabase)
- Aplicar migração para endurecer RLS e garantir `GRANT`s em todas as tabelas `public`.
- Adicionar auditoria no webhook para evitar processamento duplicado usando a tabela `webhook_events`.

### 2. Correções de Lógica e Performance
- Atualizar `src/lib/game.functions.ts` para melhor tratamento de erros amigáveis ao usuário.
- Ajustar `staleTime` e `gcTime` no TanStack Query.

### 3. Melhorias de UI/UX Premium
- Ajustar `ScratchArea.tsx` para melhor responsividade e feedback tátil.
- Adicionar estados de esqueleto (Skeleton) onde o loading está "puro".
- Corrigir tipagens e imports inconsistentes.

## Detalhes Técnicos
- Uso de `FOR UPDATE` em queries RPC para locks atômicos.
- Implementação de `useHydrated` hook para evitar erros de SSR.
- Otimização de Framer Motion com `layoutId` e `whileInView`.

