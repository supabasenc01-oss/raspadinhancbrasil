# Plano de Implementação: Gestão Completa de Banners e Validação de Imagens

O objetivo é finalizar o módulo de banners no painel administrativo, permitindo criar, editar e excluir banners com validação rigorosa de arquivos (tipo e tamanho).

## Alterações Técnicas

### Backend (Server Functions)
- Criar `upsertBanner` em `src/lib/admin.functions.ts` para salvar/atualizar no Supabase.
- Criar `deleteBanner` em `src/lib/admin.functions.ts` para remoção.

### Frontend (Admin UI)
- Implementar `BannerDialog` em `src/routes/_authenticated/admin/banners.tsx`:
    - Formulário com `title`, `subtitle`, `image_url`, `link_url`, `position`, `sort_order`, `is_active`, `starts_at`, `ends_at`.
    - Upload de imagem usando `uploadPlatformFile` (balde `banners`).
    - **Validação de Imagem**: Aceitar apenas `PNG, JPG, SVG, WebP` e limitar a `2MB`.
- Adicionar lógica de exclusão com confirmação (`toast` ou similar).
- Atualizar a lista automaticamente após mudanças usando `queryClient.invalidateQueries`.

### UI/UX
- Feedback visual durante o upload (loading state).
- Mensagens de erro claras para arquivos inválidos ou excessivamente grandes.

## Detalhes de Segurança e Performance
- Uso de `createServerFn` para operações sensíveis no banco.
- Invalidação de cache do React Query para manter a UI sincronizada.
- Sanitização de inputs e tratamento de erros de rede/permissão.
