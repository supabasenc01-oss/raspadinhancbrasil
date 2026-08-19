# Configuração de Autenticação Google (Supabase Externo)

Este guia detalha os passos necessários para configurar o login social com Google no seu banco de dados externo.

## 1. Google Cloud Console (Obter Credenciais)

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie um novo projeto ou selecione um existente.
3. Vá em **APIs e Serviços > Tela de permissão OAuth**:
   - Escolha "Externo" e preencha os dados do seu site.
   - Adicione o domínio `lovable.app` e o domínio da sua aplicação (`raspadinhancbrasil.lovable.app`) aos domínios autorizados.
4. Vá em **APIs e Serviços > Credenciais > Criar Credenciais > ID do cliente OAuth**:
   - Tipo de aplicativo: **Aplicativo da Web**.
   - Nome: `RaspaPremium - Supabase`.
   - **Origens JavaScript autorizadas**: 
     - `https://id-preview--48d97f4d-3bf7-465c-93e4-0de3c898b181.lovable.app`
     - `https://raspadinhancbrasil.lovable.app`
     - `http://localhost:8080`
   - **URIs de redirecionamento autorizados**:
     - `https://endmonqujwhbprzprwjh.supabase.co/auth/v1/callback`
5. Salve e copie o **Client ID** e o **Client Secret**.

## 2. Painel do Supabase Externo

1. No painel do seu Supabase, vá em **Authentication > Providers > Google**.
2. Ative o provider ("Enable Google Enabled").
3. Cole o **Client ID** e o **Client Secret** obtidos no Google Cloud.
4. Clique em **Save**.
5. Verifique se a "Redirect URL" no Supabase é exatamente `https://endmonqujwhbprzprwjh.supabase.co/auth/v1/callback`.

## 3. Considerações Adicionais

- O sistema já possui o botão "Google" nas telas de login e cadastro.
- O redirecionamento após o login será feito automaticamente para o seu painel.
