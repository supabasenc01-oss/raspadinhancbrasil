# Plano de Implementação: Autenticação Google e Ajustes do Banco Externo

Este plano detalha a implementação do login via Google e a finalização das configurações para o banco de dados externo.

## 1. Documentação de Configuração
- Criar guia passo a passo para o usuário configurar o Google Cloud Console e o Supabase Externo (já iniciado em `SUPABASE_GOOGLE_AUTH.md`).

## 2. Frontend: Login Social
- **useAuth.tsx**: Adicionar o método `signInWithGoogle` utilizando o cliente Supabase configurado.
- **login.tsx**: Adicionar botão "Entrar com Google" com a identidade visual da plataforma.
- **cadastro.tsx**: Adicionar botão "Cadastrar com Google".

## 3. Banco de Dados: Tabelas Faltantes e RLS
- Verificar se as tabelas `withdrawals` e `payment_transactions` foram criadas corretamente no banco externo.
- Garantir que as permissões (`GRANT`) e políticas RLS estejam aplicadas no banco externo para evitar erros de permissão.

## 4. Ajustes Finais de Configuração
- Garantir que as variáveis de ambiente externas estejam sendo lidas corretamente em todos os pontos de entrada do servidor.

## Detalhes Técnicos
- Utilizar `supabase.auth.signInWithOAuth({ provider: 'google', ... })`.
- Redirecionar para `${window.location.origin}/auth/callback` após o login social.
- A coluna `is_featured` deve ser mantida como padrão em todas as consultas SQL para evitar erros de esquema.
