# Plano de Melhoria do Painel Administrativo

O objetivo é tornar o painel administrativo mais estável, intuitivo e funcional, resolvendo problemas de carregamento de marca, falhas de salvamento e facilitando a personalização visual.

## Melhorias Técnicas

### 1. Estabilidade de Autenticação e Sessão
- **Problema**: O painel "some" ao trocar de aba ou exige login frequente.
- **Solução**: 
    - Garantir que a persistência de sessão no Supabase esteja configurada corretamente (`persistSession: true`).
    - Ajustar o middleware de proteção de rotas para ser mais resiliente a estados de carregamento.
    - Otimizar o `AuthProvider` para evitar re-renderizações desnecessárias que podem causar "flashes" de deslogado.

### 2. Carregamento de Marca (Logo vs Nome)
- **Problema**: O nome do site aparece brevemente antes da imagem do logotipo carregar.
- **Solução**: 
    - Implementar um estado de "loading" visual ou placeholder para a área do logo.
    - Ajustar a lógica do `BrandLogo` para não renderizar o texto se uma URL de logo estiver configurada, mesmo antes do carregamento completo da imagem (usando `opacity` ou `visibility`).
    - Priorizar o carregamento da imagem do logo.

### 3. Facilidade de Uso: Seletor de Cores (Color Picker)
- **Problema**: Necessidade de digitar códigos hexadecimais manualmente.
- **Solução**: 
    - Criar um componente `ColorInput` que integra um seletor de cores nativo (`type="color"`) ao lado do campo de texto hexadecimal.
    - Atualizar a aba "Cores & Identidade" nas configurações para usar este novo componente.

### 4. Correção do Salvamento de Configurações
- **Problema**: Erro ao salvar modificações (Unauthorized/Invalid Token).
- **Solução**: 
    - Já identificamos e corrigimos parcialmente o erro de token em ambientes de preview.
    - Vamos garantir que o `attachSupabaseAuth` esteja enviando o token mais recente em todas as chamadas RPC.
    - Adicionar logs de erro mais claros no frontend para diagnosticar falhas silenciosas.

## Detalhes Técnicos

- **Componentes**: Criar `src/components/admin/ColorInput.tsx`.
- **Hooks**: Refinar `useAuth.tsx` para melhor gerenciamento de estado.
- **Configurações**: Atualizar `src/routes/_authenticated/admin/configuracoes.tsx` para usar os novos inputs e melhorar o feedback de salvamento.
- **Layout**: Ajustar `src/components/admin/AdminShell.tsx` e `src/components/layout/SiteHeader.tsx`.
