# Scratchpad Foundation

ETAPA 1 — ARQUITETURA BASE DA PLATAFORMA DE RASPADINHAS

Crie a base de uma plataforma profissional de raspadinhas online, utilizando Lovable no frontend e Supabase como backend.

NÃO implementar ainda pagamentos, sorteio real ou carteira financeira completa. Nesta primeira etapa, quero construir uma fundação sólida para receber as próximas etapas.

TECNOLOGIA

Utilizar:

- React + TypeScript.

- Supabase.

- PostgreSQL.

- Supabase Auth.

- Supabase Storage.

- Tailwind CSS.

- Componentes reutilizáveis.

- Layout responsivo.

- Mobile First.

IDENTIDADE VISUAL

Criar uma interface premium, moderna e tecnológica, padrão 2026.

Visual:

- Fundo escuro elegante.

- Gradientes.

- Cards modernos.

- Brilhos discretos.

- Bordas arredondadas.

- Efeitos de hover.

- Microanimações.

- Excelente experiência em celular.

- Interface rápida e limpa.

Não exagerar nas animações.

ESTRUTURA INICIAL

Criar:

/

/home

/login

/cadastro

/esqueci-senha

/dashboard

/raspadinhas

/raspadinha/:slug

/ganhadores

/como-funciona

/faq

/termos

/privacidade

/admin

/admin/dashboard

/admin/raspadinhas

/admin/usuarios

/admin/premios

/admin/banners

/admin/configuracoes

AUTENTICAÇÃO

Implementar Supabase Auth.

Permitir:

- Cadastro.

- Login.

- Logout.

- Recuperação de senha.

- Sessão persistente.

- Proteção de rotas.

Criar tabela profiles relacionada ao usuário autenticado.

Campos:

- id

- full_name

- email

- phone

- avatar_url

- status

- created_at

- updated_at

PERFIS DE ACESSO

Criar estrutura para:

- SUPER_ADMIN

- ADMIN

- OPERADOR

- FINANCEIRO

- SUPORTE

- USER

Criar tabela:

roles

e relacionamento apropriado com profiles.

O usuário comum nunca poderá acessar páginas administrativas.

BANCO DE DADOS INICIAL

Criar tabelas:

profiles

roles

user_roles

scratch_cards

scratch_card_prizes

banners

notifications

admin_logs

system_settings

Criar:

- UUID.

- Primary keys.

- Foreign keys.

- Índices.

- created_at.

- updated_at.

- Constraints.

RLS

Ativar Row Level Security em todas as tabelas.

Usuários só poderão visualizar seus próprios dados.

Dados administrativos só poderão ser acessados por usuários autorizados.

Não utilizar políticas abertas como:

USING (true)

em tabelas sensíveis.

STORAGE

Criar buckets:

avatars

scratch-cards

scratch-cards-backgrounds

prizes

banners

logos

Criar policies apropriadas para upload e leitura.

PAINEL ADMINISTRATIVO

Criar dashboard inicial com menu lateral:

Dashboard

Raspadinhas

Prêmios

Usuários

Banners

Ganhadores

Financeiro

Relatórios

Logs

Configurações

Nesta primeira etapa, algumas páginas podem aparecer como "Módulo em construção", mas a estrutura de navegação deve existir.

HOME

Criar uma Home profissional com:

Header.

Logo.

Menu:

Início

Raspadinhas

Ganhadores

Como funciona

FAQ

Botões:

Entrar

Criar conta

Criar seção hero com espaço para banner.

Criar seção:

"Raspadinhas em destaque"

Criar cards inicialmente utilizando dados do banco.

Criar seção:

"Últimos ganhadores"

Criar seção:

"Como funciona"

Criar footer.

RASPADINHAS

Criar página /raspadinhas.

Mostrar raspadinhas cadastradas no banco.

Cada card deverá possuir:

- Imagem.

- Nome.

- Descrição.

- Valor.

- Status.

- Badge.

- Botão "Ver raspadinha".

ADMIN — CRIAÇÃO DE RASPADINHA

Criar formulário administrativo contendo:

- Nome.

- Slug.

- Descrição.

- Imagem.

- Valor.

- Status.

- Destaque.

- Grátis ou paga.

- Data de início.

- Data de encerramento.

Ainda não implementar o motor de sorteio.

IMPORTANTE

Não criar dados financeiros falsos.

Não criar ganhadores falsos.

Não criar pagamentos simulados como se fossem reais.

Utilizar dados DEMO somente quando explicitamente identificados como DEMO.

QUALIDADE

Antes de concluir:

- Verificar rotas.

- Verificar autenticação.

- Verificar RLS.

- Verificar responsividade.

- Corrigir erros TypeScript.

- Corrigir erros de console.

- Verificar se o banco está funcionando.

- Verificar se o upload funciona.

- Verificar permissões administrativas.

Não avançar para funcionalidades financeiras nesta etapa.

Ao terminar, deixe a aplicação pronta para receber a ETAPA 2.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://raspadinhancbrasil.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/48d97f4d-3bf7-465c-93e4-0de3c898b181).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
