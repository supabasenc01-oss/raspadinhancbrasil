# Configuração de Autenticação Google (Supabase Externo)

Este guia detalha os passos necessários para configurar o login social com Google no seu banco de dados externo.

## 1. Google Cloud Console (Obter Credenciais)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto ou selecione um existente.
3. Vá em **APIs e Serviços > Tela de permissão OAuth**:
   - Escolha "Externo" e preencha os dados do seu site.
   - Adicione o domínio `lovable.app` e o domínio da sua aplicação (`raspadinhancbrasil.lovable.app`) aos domínios autorizados.
4. Vá em **Credenciais > Criar Credenciais > ID do cliente OAuth**:
   - Tipo de aplicativo: **Aplicativo da Web**.
   - Nome: `RaspaPremium - Supabase`.
   - **Origens JavaScript autorizadas**: 
     - `https://id-preview--48d97f4d-3bf7-465c-93e4-0de3c898b181.lovable.app` (Preview)
     - `https://raspadinhancbrasil.lovable.app` (Produção)
     - `http://localhost:8080` (Desenvolvimento local)
   - **URIs de redirecionamento autorizados**: Você precisará da URL de Callback do seu Supabase Externo.
     - Ela tem o formato: `https://[SEU-PROJECT-REF].supabase.co/auth/v1/callback`
5. Salve e copie o **Client ID** e o **Client Secret**.

## 2. Painel do Supabase Externo

1. No painel do seu Supabase, vá em **Authentication > Providers > Google**.
2. Ative o provider ("Enable Google Enabled").
3. Cole o **Client ID** e o **Client Secret** obtidos no Google Cloud.
4. Clique em **Save**.
5. Copie a "Redirect URL" que aparece nesta tela e cole de volta no Google Cloud Console (se ainda não o fez).

## 3. Configuração no Código da Plataforma

O sistema já está preparado para usar a autenticação do seu banco de dados externo. Para garantir que o Google apareça na tela de login, siga os passos de implementação abaixo.
