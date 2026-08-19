# Plano de Correção: Exibição de Logotipo e Nome do Site

O objetivo é resolver definitivamente a falha na exibição do logotipo e do nome do site, garantindo que as alterações feitas no painel administrativo sejam refletidas corretamente em toda a plataforma.

## Problemas Identificados

1.  **Resolução de URL no Storage:** O `resolveFileUrl` tenta converter caminhos como `logos/uuid.png` em URLs públicas. Se o domínio do Supabase não estiver configurado corretamente no ambiente ou se houver problemas de cache, a imagem falha.
2.  **Sincronização de Estado:** O `useSettings` limpa aspas de valores JSONB, mas pode haver inconsistências na forma como os dados são lidos vs. escritos.
3.  **Cache do Navegador/Query:** As imagens e o nome do site podem estar ficando presos em cache antigo mesmo após a atualização no banco.

## Etapas de Implementação

### 1. Robustez na Resolução de URLs de Arquivos
- Ajustar `src/lib/storage.ts` para ser mais resiliente na detecção e construção de URLs, especialmente para o bucket `logos`.
- Garantir que `cacheBust` seja aplicado agressivamente para logotipos e favicons.

### 2. Correção no Hook de Configurações
- Refinar `src/hooks/useSettings.ts` para garantir que `siteName` e `logoUrl` sejam sempre extraídos corretamente do banco, tratando falhas de parsing de JSON de forma silenciosa e segura.

### 3. Melhoria na Exibição do Header
- Atualizar `src/components/layout/SiteHeader.tsx` para garantir que o logotipo e o nome do site usem o `cacheBust` vindo da data de atualização da configuração (`updated_at`).

### 4. Correção no Painel Administrativo
- Garantir que ao salvar as configurações em `src/routes/_authenticated/admin/configuracoes.tsx`, o `queryClient` invalide não apenas os logs, mas todas as referências a configurações e URLs de arquivos.

## Detalhes Técnicos

- **Storage:** Usar `getPublicUrl` de forma consistente e adicionar um fallback para construção manual da URL caso a detecção automática de ambiente falhe.
- **Cache Busting:** Usar a coluna `updated_at` da tabela `system_settings` como sufixo `?v=` nas URLs de imagem.
- **Validação:** Adicionar logs de depuração (debug logs) no cliente para rastrear o que está sendo retornado pelo Supabase.
