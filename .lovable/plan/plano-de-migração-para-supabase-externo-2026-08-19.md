# Plano de Migração para Supabase Externo

Este plano detalha as etapas para migrar a estrutura de banco de dados e a conexão da aplicação para o seu projeto Supabase externo.

## Objetivos
- Configurar a conexão da aplicação com o novo banco de dados externo.
- Replicar a estrutura de tabelas, enums, RLS e permissões no novo ambiente.
- Garantir que a autenticação e as funções administrativas continuem operacionais.

## Etapas

### 1. Preparação da Migração
- [x] Obter URL do projeto externo.
- [x] Obter Service Role Key (armazenada de forma segura).
- [ ] Consolidar todas as migrações SQL existentes no projeto.

### 2. Execução das Migrações no Banco Externo
- Executar o script SQL consolidado no novo banco de dados.
- **Nota:** Como sou um agente de IA, não posso executar comandos SQL administrativos diretamente via terminal no seu banco externo sem uma RPC de execução. 
- **Ação necessária:** Você precisará copiar o conteúdo do arquivo SQL consolidado que vou gerar e colá-lo no **SQL Editor** do seu painel do Supabase.

### 3. Configuração da Aplicação
- Atualizar os arquivos de integração (`src/integrations/supabase/client.ts`, `client.server.ts` e `auth-middleware.ts`) para utilizar as novas variáveis de ambiente.
- Configurar o provedor de autenticação no novo Supabase (Google Auth, redirecionamentos, etc.).

### 4. Verificação
- Testar o login administrativo.
- Verificar a listagem de raspadinhas e saldos.

## Detalhes Técnicos

### Arquivo SQL
Vou gerar um arquivo chamado `supabase_external_migration.sql` contendo:
- Criação de Enums (`app_role`, `profile_status`, `scratch_card_status`).
- Criação de todas as tabelas (`profiles`, `user_roles`, `scratch_cards`, `wallets`, `withdrawals`, etc.).
- Políticas de Segurança (RLS).
- Permissões (`GRANT`).
- Funções de segurança definer (como `has_role`).

### Variáveis de Ambiente
A aplicação passará a usar:
- `EXTERNAL_SUPABASE_URL`
- `EXTERNAL_SUPABASE_SERVICE_ROLE_KEY`
- A `anon key` do novo projeto também será necessária para o client-side.

**IMPORTANTE:** A migração de usuários existentes não é automática. Se você tiver usuários criados no banco interno, eles precisarão ser recriados ou migrados manualmente (export/import de auth.users).
